---
abbrlink: syncmutex
published: 2021-12-04
tags:
- Golang
- 并发编程
title: sync.Mutex
---

>sync.Mutex 是 Go 语言中实现互斥锁的核心结构

<!--more-->
## 1 基本结构
```go
// sync/mutex.go 25行
type Mutex struct {
	state int32      // 当前互斥锁的状态
	sema  uint32     // 控制锁状态的信号量
}
```
### 1.1 state字段

低三位分别标识
- mutexLocked（是否上锁）
- mutexWoken（是否有协程在抢锁）
- mutexStarving（是否处于饥饿模式）
- 高 29 位的值聚合为一个范围为 0~2^29-1 的整数，表示在阻塞队列中等待的协程个数.

### 1.2 正常模式和饥饿模式
>mutex 是公平锁

`正常模式`：锁的等待者会按照`先进先出`的顺序获取锁。但是刚被唤起的 Goroutine 与新创建的 Goroutine 竞争时，大概率会获取不到锁，为了减少这种情况的出现，一旦 Goroutine `超过 1ms` 没有获取到锁，它就会将当前互斥锁切换饥饿模式，防止部分 Goroutine 被**饿死**。
`饥饿模式`：互斥锁会直接交给等待队列最前面的 Goroutine。新的 Goroutine 在该状态下不能获取锁、也不会进入自旋状态，它们只会在队列的末尾等待。如果一个 Goroutine 获得了互斥锁并且它在队列的末尾或者它等待的时间`少于 1ms`，那么当前的互斥锁就会切换回正常模式。


## 2 加解锁过程
### 2.1 加锁
```go
// sync/mutex.go 72 行
func (m *Mutex) Lock() {
	// Fast path: grab unlocked mutex.
	if atomic.CompareAndSwapInt32(&m.state, 0, mutexLocked) {
		return
	}
	// Slow path (outlined so that the fast path can be inlined)
	m.lockSlow()
}
```

#### 2.1.1 Fast path
```go
if atomic.CompareAndSwapInt32(&m.state, 0, mutexLocked) {
    return
}
```
>首先进行 `CAS` 操作，假如当前未上锁且锁内不存在阻塞协程，则直接 CAS 抢锁成功返回


#### 2.1.2 Slow Path
如果互斥锁的状态不是 0 时就会进入 Slow Path。尝试通过自旋（Spinnig）等方式等待锁的释放，该方法的主体是一个非常大 for 循环，这里将它分成几个部分介绍获取锁的过程：

##### 2.1.2.1 判断当前 Goroutine 能否进入自旋
**自旋是一种多线程同步机制**，当前的进程在进入自旋的过程中会一直保持 CPU 的占用，持续检查某个条件是否为真。**在多核的 CPU 上，自旋可以避免 Goroutine 的切换**，使用恰当会对性能带来很大的增益，但是使用的不恰当就会拖慢整个程序，所以 Goroutine 进入自旋的条件非常苛刻：
- 互斥锁只有在普通模式才能进入自旋；
- `runtime.sync_runtime_canSpin`需要返回 true
	- 运行在多 CPU 的机器上；
	* 当前 Goroutine 为了获取该锁进入自旋的次数小于四次；
	* 当前机器上至少存在一个正在运行的处理器 P 并且处理的运行队列为空；

##### 2.1.2.2 通过自旋等待互斥锁的释放
一旦当前 Goroutine 能够进入自旋就会调用`runtime.sync_runtime_doSpin`和`runtime.procyield`执行 30 次的 `PAUSE` 指令，该指令只会占用 CPU 并消耗 CPU 时间：
##### 2.1.2.3 计算互斥锁的最新状态
处理了自旋相关的特殊逻辑之后，互斥锁会根据上下文计算当前互斥锁最新的状态。几个不同的条件分别会更新 `state` 字段中存储的不同信息 — `mutexLocked`、`mutexStarving`、`mutexWoken` 和 `mutexWaiterShift`：
##### 2.1.2.4 更新互斥锁的状态并获取锁
计算了新的互斥锁状态之后，会使用 CAS 函数更新状态
如果没有通过 CAS 获得锁，会调用 `runtime.sync_runtime_SemacquireMutex` 通过信号量保证资源不会被两个 Goroutine 获取。
`runtime.sync_runtime_SemacquireMutex` 会在方法中不断尝试获取锁并陷入休眠等待信号量的释放，一旦当前 Goroutine 可以获取信号量，它就会立刻返回，`sync.Mutex.Lock`的剩余代码也会继续执行。
- 在正常模式下，这段代码会设置唤醒和饥饿标记、重置迭代次数并重新执行获取锁的循环；
- 在饥饿模式下，当前 Goroutine 会获得互斥锁，如果等待队列中只存在当前 Goroutine，互斥锁还会从饥饿模式中退出；


### 2.2 解锁

#### 2.2.1 Fast path
该过程会先使用`atomic.AddInt32函数快速解锁，这时会发生下面的两种情况：`
- 如果该函数返回的新状态等于 0，当前 Goroutine 就成功解锁了互斥锁；
- 如果该函数返回的新状态不等于 0，则进入 Slow path。
#### 2.2.2 Slow path
先校验锁状态的`合法性` — 如果当前互斥锁已经被解锁过了会直接抛出异常 “sync: unlock of unlocked mutex” 中止当前程序。
在正常模式下，上述代码会使用如下所示的处理过程：
- 如果互斥锁不存在等待者或者互斥锁的 `mutexLocked`、`mutexStarving`、`mutexWoken` 状态不都为 0，那么当前方法可以直接返回，不需要唤醒其他等待者；
- 如果互斥锁存在等待者，会通过`runtime_Semrelease`唤醒等待者并移交锁的所有权；
在饥饿模式下，上述代码会直接调用`runtime_Semrelease`将当前锁交给下一个正在尝试获取锁的等待者，等待者被唤醒后会得到锁，在这时互斥锁还不会退出饥饿状态；

## 3 小结
互斥锁的**加锁过程**比较复杂，它涉及自旋、信号量以及调度等概念：

- 如果互斥锁处于初始化状态，会通过置位 `mutexLocked` 加锁；
- 如果互斥锁处于 `mutexLocked` 状态并且在普通模式下工作，会进入自旋，执行 30 次 `PAUSE` 指令消耗 CPU 时间等待锁的释放；
- 如果当前 Goroutine 等待锁的时间超过了 1ms，互斥锁就会切换到饥饿模式；
- 互斥锁在正常情况下会通过`sync_runtime_SemacquireMutex`将尝试获取锁的 Goroutine 切换至休眠状态，等待锁的持有者唤醒；
- 如果当前 Goroutine 是互斥锁上的最后一个等待的协程或者等待的时间小于 1ms，那么它会将互斥锁切换回正常模式；

互斥锁的**解锁过程**与之相比就比较简单：

* 当互斥锁已经被解锁时，调用 Mutex.Lock 会直接抛出异常；
* 当互斥锁处于饥饿模式时，将锁的所有权交给队列中的下一个等待者，等待者会负责设置 `mutexLocked` 标志位；
* 当互斥锁处于普通模式时，如果没有 Goroutine 等待锁的释放或者已经有被唤醒的 Goroutine 获得了锁，会直接返回；在其他情况下会通过`sync.runtime_Semrelease` 唤醒对应的 Goroutine；

## 4 Sync.RWMutex

>从逻辑上，可以把 RWMutex 理解为一把读锁加一把写锁；
>写锁具有`严格的排他性`，当其被占用，其他试图取写锁或者读锁的 goroutine 均阻塞；
>读锁具有`有限的共享性`，当其被占用，试图取写锁的 goroutine 会阻塞，试图取读锁的 goroutine 可与当前 goroutine 共享读锁；
>RWMutex 适用于`读多写少`的场景，最理想化的情况，当所有操作均使用读锁，则可实现无锁化；最悲观的情况，倘若所有操作均使用写锁，则 RWMutex 退化为普通的 Mutex.

### 4.1 数据结构

```go
const rwmutexMaxReaders = 1 << 30   // 共享读锁的 goroutine 数量上限，值为 2^29；

type RWMutex struct {
    w           Mutex  // 内置的一把普通互斥锁 sync.Mutex；
    writerSem   uint32 // 关联写锁阻塞队列的信号量；
    readerSem   uint32 // 关联读锁阻塞队列的信号量；
    readerCount int32  // 正常情况下等于介入读锁流程的 goroutine 数量；当 goroutine 接入写锁流程时，该值为实际介入读锁流程的 goroutine 数量减 rwmutexMaxReaders.
    readerWait  int32  // 记录在当前 goroutine 获取写锁前，还需要等待多少个 goroutine 释放读锁.
}
```

### 4.2 读锁流程
#### 4.2.1 RLock
• 基于原子操作，将 RWMutex 的 readCount 变量加一，表示占用或等待读锁的 goroutine 数加一；
• 倘若 RWMutex.readCount 的新值仍小于 0，说明有 goroutine 未释放写锁，因此将当前 goroutine 添加到读锁的阻塞队列中并阻塞挂起.
#### 4.2.2 RUnlock
• 基于原子操作，将 RWMutex 的 readCount 变量加一，表示占用或等待读锁的 goroutine 数减一；
• 倘若 RWMutex.readCount 的新值小于 0，说明有 goroutine 在等待获取写锁，则走入 RWMutex.rUnlockSlow 的流程中.
#### 4.2.3 rUnlockSlow
• 对 RWMutex.readerCount 进行校验，倘若发现当前协程此前未抢占过读锁，或者介入读锁流程的 goroutine 数量达到上限，则抛出 fatal；
(倘若 r+1 == -rwmutexMaxReaders，说明此时有 goroutine 介入写锁流程，但当前此前未加过读锁，具体原因见 2.3 小节；倘若 r+1=0，则要么此前未加过读锁，要么介入读锁流程的 goroutine 数量达到上限

• 基于原子操作，对 RWMutex.readerWait 进行减一操作，倘若其新值为 0，说明当前 goroutine 是最后一个介入读锁流程的协程，因此需要唤醒一个等待写锁的阻塞队列的 goroutine.（综合 RWMutex.readerCount 为负值，可以确定存在等待写锁的 goroutine，具体原因见 2.3 小节.）

### 4.3 写锁流程
#### 4.3.1 Lock
• 对 RWMutex 内置的互斥锁进行加锁操作；
• 基于原子操作，对 RWMutex.readerCount 进行减少 -rwmutexMaxReaders 的操作；
• 倘若此时存在未释放读锁的 gouroutine，则基于原子操作在 RWMutex.readerWait 的基础上加上介入读锁流程的 goroutine 数量，并将当前 goroutine 添加到写锁的阻塞队列中挂起.
#### 4.3.2 Unlock
• 基于原子操作，将 RWMutex.readerCount 的值加上 rwmutexMaxReaders；
• 倘若发现 RWMutex.readerCount 的新值大于 rwmutexMaxReaders，则说明要么当前 RWMutex 未上过写锁，要么介入读锁流程的 goroutine 数量已经超限，因此直接抛出 fatal；
• 因此唤醒读锁阻塞队列中的所有 goroutine；(可见，竞争读锁的 goroutine 更具备优势)
• 解开 RWMutex 内置的互斥锁.

## 5 总结

go-sync.Mutex 是 Go 语言中实现互斥锁的核心结构，通过 state 字段管理锁状态（正常/饥饿模式），利用 CAS 操作和信号量控制协程的加解锁流程，其中写锁具有严格排他性，读锁支持有限共享，适用于读多写少场景，通过自旋和队列调度平衡性能与公平性。