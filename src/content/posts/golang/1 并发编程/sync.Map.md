---
abbrlink: syncmap
published: 2022-07-09
tags:
- Golang
- 并发编程
title: sync.Map
---

> 在 golang 中, map 并不保证并发安全的安全性, 对 map 进行并发读写会导致严重的错误, sync 标准包下的 sync.Map 解决了这一问题.

<!--more-->

## 1 数据结构

### 1.1 sync.Map


```go
type Map struct {
    mu Mutex
    read atomic.Value 
    dirty map[any]*entry
    misses int
}
```

- read：无锁化的只读 map，实际类型为 readOnly
- dirty：加锁处理的读写 map
- misses：记录访问 read 的失效次数，累计达到阈值时，会进行 read map/dirty map 的更新轮换
- mu：一把互斥锁，实现 dirty 和 misses 的并发管理
- sync.Map 的特点是冗余了两份 map：read map 和 dirty map

### 1.2 entry 及对应的几种状态

```
type entry struct {
	p unsafe.Pointer 
}
```

- kv 对中的 value，统一采用 unsafe.Pointer 的形式进行存储，通过 entry.p 的指针进行链接
- entry.p 的指向分为三种情况：
	- 存活态：正常指向元素
	- 软删除态：指向 nil, nil 态表示软删除，read map 和 dirty map 底层的 map 结构仍存在 key-entry 对，但在逻辑上该 key-entry 对已经被删除，因此无法被用户查询到
	- 硬删除态：指向固定的全局变量 expunged, expunged 态表示硬删除，dirty map 中已不存在该 key-entry 对

### 1.3 readOnly

```go
type readOnly struct {
    m       map[any]*entry
    amended bool // true if the dirty map contains some key not in m.
}
```

sync.Map 中的只读 map：read 内部包含两个成员属性：
- m：真正意义上的 read map，实现从 key 到 entry 的映射；
- amended：标识 read map 中的 key-entry 对是否存在缺失，需要通过 dirty map 兜底.

## 2 读流程

### 2.1 sync.Map.Load()

```go
func (m *Map) Load(key any) (value any, ok bool) {
    read, _ := m.read.Load().(readOnly)
    e, ok := read.m[key]
    if !ok && read.amended {
        m.mu.Lock()
        read, _ = m.read.Load().(readOnly)
        e, ok = read.m[key]
        if !ok && read.amended {
            e, ok = m.dirty[key]
            m.missLocked()
        }
        m.mu.Unlock()
    }
    if !ok {
        return nil, false
    }
    return e.load()
}
```

- 检查  read map 中是否存在 key-entry 对，若存在，则直接读取 entry 返回
- 如果第一轮 read map 查询 miss，且 read map 不全，则需要加锁 double check
- 如果第二轮 read map 查询仍 miss（加锁后），且 read map 不全，则查询 dirty map 兜底
- 查询操作涉及到与 dirty map 的交互，misses 加一
- 解锁，返回查得的结果

### 2.2 entry.load()

```go
func (e *entry) load() (value any, ok bool) {
    p := atomic.LoadPointer(&e.p)
    if p == nil || p == expunged {
        return nil, false
    }
    return *(*any)(p), true
}
```

- sync.Map 中，kv 对的 value 是基于 entry 指针封装的形式；
- 从 map 取得 entry 后，最终需要调用 entry.load 方法读取指针指向的内容；
- 如果 entry 的指针状态为 nil 或者 expunged，说明 key-entry 对已被删除，则返回 nil；
- 如果 entry 未被删除，则读取指针内容，并且转为 any 的形式进行返回.

### 2.3 sync.Map.missLocked()

```go
func (m *Map) missLocked() {
    m.misses++
    if m.misses < len(m.dirty) {
        return
    }
    m.read.Store(readOnly{m: m.dirty})
    m.dirty = nil
    m.misses = 0
}
```

- 在读流程中，倘若未命中 read map，且由于 read map 内容存在缺失需要和 dirty map 交互时，会走进 missLocked 流程；
- 在 missLocked 流程中，首先 misses 计数器累加 1；
- 如果 miss 次数小于 dirty map 中存在的 key-entry 对数量，直接返回即可；
- 如果 miss 次数大于等于 dirty map 中存在的 key-entry 对数量，则使用 dirty map 覆盖 read map，并将 read map 的 amended flag 置为 false；
- 新的 dirty map 置为 nil，misses 计数器清零.

## 3 写流程

### 3.1 sync.Map.Store()

```go
func (m *Map) Store(key, value any) {
    read, _ := m.read.Load().(readOnly)
    if e, ok := read.m[key]; ok && e.tryStore(&value) {
        return
    }


    m.mu.Lock()
    read, _ = m.read.Load().(readOnly)
    if e, ok := read.m[key]; ok {
        if e.unexpungeLocked() {
            m.dirty[key] = e
        }
        e.storeLocked(&value)
    } else if e, ok := m.dirty[key]; ok {
        e.storeLocked(&value)
    } else {
        if !read.amended {
            m.dirtyLocked()
            m.read.Store(readOnly{m: read.m, amended: true})
        }
        m.dirty[key] = newEntry(value)
    }
    m.mu.Unlock()
}


func (e *entry) storeLocked(i *any) {
    atomic.StorePointer(&e.p, unsafe.Pointe
}
```

- 如果 read map 存在拟写入的 key，且 entry 不为 expunged 状态，说明这次操作属于更新而非插入，直接基于 CAS 操作进行 entry 值的更新，并直接返回（存活态或者软删除，直接覆盖更新）
- 如果未命中，则需要加锁 double check
- 如果第二轮检查中发现 read map 或者 dirty map 中存在 key-entry 对，则直接将 entry 更新为新值即可（存活态或者软删除，直接覆盖更新）
- 如果发现 read map 中该 key-entry 为 expunged 态，需要在 dirty map 先补齐 key-entry 对，再更新 entry 值（从硬删除中恢复，然后覆盖更新）
- 如果 read map 和 dirty map 均不存在，则在 dirty map 中插入新 key-entry 对，并且保证 read map 的 amended flag 为 true.（插入）
- 如果发现 dirty map 未初始化，需要前置执行 dirtyLocked 流程
- 解锁返回

### 3.2 entry.tryStore()

```go
func (m *Map) Store(key, value any) {
    read, _ := m.read.Load().(readOnly)
    if e, ok := read.m[key]; ok && e.tryStore(&value) {
        return
    }


    m.mu.Lock()
   // ...
}


func (e *entry) tryStore(i *any) bool {
    for {
        p := atomic.LoadPointer(&e.p)
        if p == expunged {
            return false
        }
        if atomic.CompareAndSwapPointer(&e.p, p, unsafe.Pointer(i)) {
            return true
        }
    }
}
```

- 在写流程中，如果发现 read map 中已存在对应的 key-entry 对，则会对调用 tryStore 方法尝试进行更新；
- 如果 entry 为 expunged 态，说明已被硬删除，dirty 中缺失该项数据，因此 tryStore 执行失败，回归主干流程；
- 如果 entry 非 expunged 态，则直接执行 CAS 操作完成值的更新即可.

### 3.3 entry.unexpungeLocked()

```go
func (m *Map) Store(key, value any) {
    // ...
    m.mu.Lock()
    read, _ = m.read.Load().(readOnly)
    if e, ok := read.m[key]; ok {
        if e.unexpungeLocked() {
            m.dirty[key] = e
        }
        e.storeLocked(&value)
    } 
    // ...
}


func (e *entry) unexpungeLocked() (wasExpunged bool) {
    return atomic.CompareAndSwapPointer(&e.p, expunged, nil)
}
```

- 在写流程加锁 double check 的过程中，如果发现 read map 中存在对应的 key-entry 对，会执行该方法；
- 如果 key-entry 为硬删除 expunged 态，该方法会基于 CAS 操作将其更新为软删除 nil 态，然后进一步在 dirty map 中补齐该 key-entry 对，实现从硬删除到软删除的恢复.

### 3.4 entry.storeLocked()

```go
func (m *Map) Store(key, value any) {
    // ...
    m.mu.Lock()
    read, _ = m.read.Load().(readOnly)
    if e, ok := read.m[key]; ok {
       // ...
        e.storeLocked(&value)
    } else if e, ok := m.dirty[key]; ok {
        e.storeLocked(&value)
    } 
    // ...
}


func (e *entry) storeLocked(i *any) {
    atomic.StorePointer(&e.p, unsafe.Pointer)
}
```

- 写流程中，如果 read map 或者 dirty map 存在对应 key-entry，最终会通过原子操作，将新值的指针存储到 entry.p 当中.

### 3.5 sync.Map.dirtyLocked()

```go
func (m *Map) dirtyLocked() {
    if m.dirty != nil {
        return
    }


    read, _ := m.read.Load().(readOnly)
    m.dirty = make(map[any]*entry, len(read.m))
    for k, e := range read.m {
        if !e.tryExpungeLocked() {
            m.dirty[k] = e
        }
    }
}


func (e *entry) tryExpungeLocked() (isExpunged bool) {
    p := atomic.LoadPointer(&e.p)
    for p == nil {
        if atomic.CompareAndSwapPointer(&e.p, nil, expunged) {
            return true
        }
        p = atomic.LoadPointer(&e.p)
    }
    return p == expunged
}
```

-  在写流程中，如果需要将 key-entry 插入到兜底的 dirty map 中，并且此时 dirty map 为空（从未写入过数据或者刚发生过 missLocked），会进入 dirtyLocked 流程；
- 此时会遍历一轮 read map ，将未删除的 key-entry 对拷贝到 dirty map 当中；
- 在遍历时，还会将 read map 中软删除 nil 态的 entry 更新为硬删除 expunged 态，因为在此流程中，不会将其拷贝到 dirty map.

## 4 删流程

### 4.1 sync.Map.Delete()

```go
func (m *Map) Delete(key any) {
    m.LoadAndDelete(key)
}


func (m *Map) LoadAndDelete(key any) (value any, loaded bool) {
    read, _ := m.read.Load().(readOnly)
    e, ok := read.m[key]
    if !ok && read.amended {
        m.mu.Lock()
        read, _ = m.read.Load().(readOnly)
        e, ok = read.m[key]
        if !ok && read.amended {
            e, ok = m.dirty[key]
            delete(m.dirty, key)
            m.missLocked()
        }
        m.mu.Unlock()
    }
    if ok {
        return e.delete()
    }
    return nil, false
}
```

- 如果 read map 中存在 key，则直接基于 cas 操作将其删除；
- 如果 read map 不存在 key，且 read map 有缺失（amended flag 为 true），则加锁 double check；
- 如果加锁 double check 时，read map 仍不存在 key 且 read map 有缺失，则从 dirty map 中取元素，并且将 key-entry 对从 dirty map 中物理删除；
- 删操作需要和 dirty map 交互，需要 missLocked 流程；
- 解锁；
- 如果从 read map 或 dirty map 中获取到了 key 对应的 entry，则走入 entry.delete() 方法逻辑删除 entry；
- 如果 read map 和 dirty map 中均不存在 key，返回 false 标识删除失败


### 4.2 entry.delete()

```go
func (e *entry) delete() (value any, ok bool) {
    for {
        p := atomic.LoadPointer(&e.p)
        if p == nil || p == expunged {
            return nil, false
        }
        if atomic.CompareAndSwapPointer(&e.p, p, nil) {
            return *(*any)(p), true
        }
    }
}
```

- 如果 entry 此前已被删除，则直接返回 false 标识删除失败
- 如果 entry 当前仍存在，则通过 CAS 将 entry.p 指向 nil，标识其已进入软删除状态

## 5 遍历流程

- 在遍历过程中，如果发现 read map 数据不全（amended flag 为 true），会额外加一次锁，并使用 dirty map 覆盖 read map
- 遍历 read map（通过上个步骤保证 read map 有全量数据），执行用户传入的回调函数，如果某次回调时返回值为 false，则会终止全流程

## 6 总结

### 6.1 entry 的 expunged 态

**为什么需要使用 expunged 态来区分软硬删除？**
- 无论是软删除(nil)还是硬删除(expunged),都表示在逻辑意义上 key-entry 对已经从 sync.Map 中删除，nil 和 expunged 的区别在于
	- 软删除态（nil）：read map 和 dirty map 在物理上仍保有该 key-entry 对，因此如果此时需要对该 entry 执行写操作，可以直接 CAS 操作
	- 硬删除态（expunged）：dirty map 中已经没有该 key-entry 对，如果执行写操作，必须加锁（dirty map 必须含有全量 key-entry 对数据）
- 设计 expunged 和 nil 两种状态的原因，就是为了优化在 dirtyLocked 前，针对同一个 key **先删后写**的场景. 通过 expunged 态额外标识出 dirty map 中是否仍具有指向该 entry 的能力，这样能够实现对一部分 nil 态 key-entry 对的解放，能够基于 CAS 完成这部分内容写入操作而无需加锁

### 6.2 read map 和 dirty map 的数据流转

sync.Map 由两个 map 构成：
- read map：访问时全程无锁；
- dirty map：是兜底的读写 map，访问时需要加锁

希望能根据对读、删、更新、写操作频次的探测，来实时动态地调整操作方式，希望在读、更新、删频次较高时，更多地采用 CAS 的方式无锁化地完成操作；在写操作频次较高时，则直接了当地采用加锁操作完成.

**两个 map**
- 总体思想，希望能多用 read map，少用 dirty map，因为操作前者无锁，后者需要加锁
- 除了 expunged 态的 entry 之外，read map 的内容为 dirty map 的子集


**dirty map -> read map**
- 记录读/删流程中，通过 misses 记录访问 read map miss 由 dirty 兜底处理的次数，当 miss 次数达到阈值，则进入 missLocked 流程，进行新老 read/dirty 替换流程；此时将老 dirty 作为新 read，新 dirty map 则暂时为空，直到 dirtyLocked 流程完成对 dirty 的初始化

**read map -> dirty map**
- 发生 dirtyLocked 的前置条件：I dirty 暂时为空（此前没有写操作或者近期进行过 missLocked 流程）；II 接下来一次写操作访问 read 时 miss，需要由 dirty 兜底
- 在 dirtyLocked 流程中，需要对 read 内的元素进行状态更新，因此需要遍历，是一个线性时间复杂度的过程，可能存在性能抖动
- dirtyLocked 遍历中，会将 read 中未被删除的元素（非 nil 非 expunged）拷贝到 dirty 中；会将 read 中所有此前被删的元素统一置为 expunged 态

### 6.3 适用场景与注意问题

- sync.Map 适用于读多、更新多、删多、写少的场景；
- 如果写操作过多，sync.Map 基本等价于互斥锁 + map；
- sync.Map 可能存在性能抖动问题，主要发生于在读/删流程 miss 只读 map 次数过多时（触发 missLocked 流程），下一次插入操作的过程当中（dirtyLocked 流程）