---
title: "[Go] Slice"
published: 2021-07-22
tags:
  - Golang
  - Go数据结构
lang: zh
toc: true
abbrlink: golang-slice
draft: false
---
> 切片的实现原理使用

<!--more-->

## 1 几个问题

### 1.1 问题1

- 初始化切片 s 长度和容量均为 10
- 在 s 的基础上追加 append 一个元素
- 切片s 的内容、长度以及容量分别是什么？

```go
func Test_slice(t *testing.T){
    s := make([]int,10)  
    s = append(s,10)
    t.Logf("s: %v, len of s: %d, cap of s: %d",s,len(s),cap(s))
}

s: [0 0 0 0 0 0 0 0 0 0 10], len of s: 11, cap of s: 20
```

- 基于 make(\[]int, 10) 的方式初始化切片的话其长度 len 和容量 cap 均为 10，且前10个元素是已经切实被分配过的（虽然会被填充为零值）. 此时进行 append 操作，会在末尾进行元素追加，由于切片的长度和容量是相等的，因此已经没有剩余可用的空间了，于是会进一步引发切片的扩容操作.
- 在切片原容量小于 256 的情况下，扩容时会采用原容量的2倍作为新的容量，于是在新切片中，长度增加为 11，而容量则翻倍变成 20.

### 1.2 问题2

- 初始化切片 s 长度为 0，容量为 10
- 在 s 的基础上追加 append 一个元素
- 切片s 的内容、长度以及容量分别是什么？

```go
func Test_slice(t *testing.T){
    s := make([]int,0,10)  
    s = append(s,10)
    t.Logf("s: %v, len of s: %d, cap of s: %d",s,len(s),cap(s))

s: [10], len of s: 1, cap of s: 10
}
```

- make(\[]int, 0, 10) 的方式使得切片长度为 0，容量为 10，实际上还有长度为 10 的缓存空间. 于是这一次 append 操作，会直接使用已有的空间，不会引发扩容. 结果中，切片长度从 0 增加为 1，容量则维持为 10 不变.

### 1.3 问题3

- 初始化切片 s 长度为 10，容量为 11
- 在 s 的基础上追加 append 一个元素
- 切片s 的内容、长度以及容量分别是什么？

```go
func Test_slice(t *testing.T){
    s := make([]int,10,11)  
    s = append(s,10)
    t.Logf("s: %v, len of s: %d, cap of s: %d",s,len(s),cap(s))
}

s: [0 0 0 0 0 0 0 0 0 0 10], len of s: 11, cap of s: 11
```

- 由于容量大于长度，因此仍有足够的空间，这次 append 操作不会引发扩容.

### 1.4 问题4

- 初始化切片 s 长度为 10，容量为 12
- 截取切片 s index = 8 往后的内容赋给 s1
-  s1 的内容、长度以及容量分别是什么？

```go
func Test_slice(t *testing.T){
    s := make([]int,10,12)  
    s1 := s[8:]
    t.Logf("s1: %v, len of s1: %d, cap of s1: %d",s1,len(s1),cap(s1))
}

s1: [0 0], len of s1: 2, cap of s1: 4
```

- 截取操作会以 s\[8] 作为内存空间的起点，截取所得新切片 s1 的长度和容量强依赖于原切片 s 的长度和容量，并在此基础上减去头部 8 个未使用到的单位.

### 1.5 问题5

- 初始化切片 s 长度为 10，容量为 12
- 截取切片 s index 为 \[8,9) 范围内的元素赋给切片 s1
-  s1 的内容、长度以及容量分别是什么？

```go
func Test_slice(t *testing.T){
    s := make([]int,10,12)  
    s1 := s[8:9]
    t.Logf("s1: %v, len of s1: %d, cap of s1: %d",s1,len(s1),cap(s1))
}

s1: [0], len of s1: 1, cap of s1: 4
```

- 虽然 s\[8:9] 的截取操作限定了 s1 的右边界，但这只是长度意义上的，对于容量，s1 仍然和 s 保持强关联性.

### 1.6 问题6

- 初始化切片 s 长度为 10，容量为 12
- 截取切片 s index = 8 往后的内容赋给 s1
- 修改 s1\[0] 的值
- 这个修改是否会影响到 s？ 此时，s 的内容是什么？

```go
func Test_slice(t *testing.T){
    s := make([]int,10,12)  
    s1 := s[8:]
    s1[0] = -1
    t.Logf("s: %v",s)
}

s: [0 0 0 0 0 0 0 0 -1 0]
```

s1 是在 s 基础上截取得到的，属于一次引用传递，底层共用同一片内存空间，其中 s\[x] 等价于 s1\[x+8]. 因此修改了 s1\[0] 会直接影响到 s\[8] .

### 1.7 问题7

- 初始化切片 s 长度为 10，容量为 12
- 访问 s[10] 是否会越界？

```go
func Test_slice(t *testing.T){
    s := make([]int,10,12)  
    v := s[10]
    // 此时数组访问是否会越界
}
```

- 会发生 panic
- 初始化时设定了切片长度为10，容量为 12. 容量是物理意义上的，但长度是逻辑意义上的，判断是否越界以逻辑意义为准，因此 index = 10 已经越界


### 1.8 问题8

- 初始化切片 s 长度为 10，容量为 12
- 截取 s 中 index = 8 后面的内容赋给 s1
- 在 s1 的基础上追加 \[]int{10,11,12} 3 个元素
- 访问 s\[10] 是否会越界？

```go
func Test_slice(t *testing.T){
    s := make([]int,10,12)  
    s1 := s[8:]
    s1 = append(s1,[]int{10,11,12}...)
    v := s[10]
    // ...
    // 求问，此时数组访问是否会越界
}
```

- 会发生 panic.
- 在 s 的基础上截取产生了 s1，此时 s1 和 s 会拥有两个独立的 slice header.
- 接下来执行 append 操作时，由于 s 预留的空间不足，s1 会发生扩容
- s1 扩容后，会被迁移到新的空间地址，此时 s1 已经和 s 做到真正意义上的完全独立，意味着修改 s1 不再会影响到 s
- s 继续维持原本的长度值 10 和容量值 12，因此访问 s\[10] 会panic

### 1.9 问题9

- 初始化切片 s 长度为 10，容量为 12
- 截取切片 s index = 8 往后的内容赋给 s1
- 在方法 changeSlice 中，对 s1\[0] 进行修改
- 经过上述操作之后，s 的内容是什么？

```go
func Test_slice(t *testing.T){
    s := make([]int,10,12)  
    s1 := s[8:]
    changeSlice(s1)
    t.Logf("s: %v",s)
}


func changeSlice(s1 []int){
  s1[0] = -1
}

s: [0 0 0 0 0 0 0 0 -1 0]
```

- 切片在传递时属于引用传递，且 s1\[0] 和 s\[8] 指向同一个元素. 因此在局部方法中，修改了 s1\[0] 会直接影响到 s\[8] 的内容.

### 1.10 问题10

- 初始化切片 s 长度为 10，容量为 12
- 截取切片 s index = 8 往后的内容赋给 s1
- 在方法 changeSlice 中，对 s1 进行 apend 追加操作
- 经过上述操作后，s 以及 s1 的内容、长度和容量分别是什么？

```go
func Test_slice(t *testing.T){
    s := make([]int,10,12)  
    s1 := s[8:]
    changeSlice(s1)
    t.Logf("s: %v, len of s: %d, cap of s: %d",s, len(s), cap(s))
    t.Logf("s1: %v, len of s1: %d, cap of s1: %d",s1, len(s1), cap(s1))
}


func changeSlice(s1 []int){
  s1 = append(s1, 10)

s: [0 0 0 0 0 0 0 0 0 0], len of s: 10, cap of s: 12
s1: [0 0], len of s1: 2, cap of s1: 4
}
```

- 切片是引用传递，但是在方法调用时，传递的会是一个新的 slice header.
- 因此在局部方法 changeSlice 中，虽然对 s1 进行了 append 操作，但这这会在局部方法中这个独立的 slice header 中生效，不会影响到原方法 Test_slice 当中的 s 和 s1 的长度和容量


### 1.11 问题11

- 初始化切片 s，内容为 \[]int{0,1,2,3,4}
- 截取 s 中 index = 2 前面的内容（不含s\[2]），并在此基础上追加 index = 3 后面的内容
- 经过上述操作后，s 的内容、长度和内容分别是什么？此时访问 s\[4] 是否会越界？

```go
func Test_slice(t *testing.T){
    s := []int{0,1,2,3,4}
    s = append(s[:2],s[3:]...)
    t.Logf("s: %v, len: %d, cap: %d", s, len(s), cap(s))
    v := s[4] 
    // 是否会数组访问越界
}

s: [0 1 3 4], len: 4, cap: 5
```
 
- 会发生 panic
- 执行完上述 append 操作之后，s 的实际长度为 4，容量维持不变为 5. 此时访问 s\[4]会发生数组越界的错误

### 1.12 问题12

- 初始化切片 s 长度和容量均为 512
- 在 s 的基础上追加 append 一个元素
- 经过上述操作后，切片s 的内容、长度以及容量分别是什么？

```go
func Test_slice(t *testing.T){
    s := make([]int,512)  
    s = append(s,1)
    t.Logf("len of s: %d, cap of s: %d",len(s),cap(s))
}

len: 513, cap: 848
```

- 由于切片 s 原有容量为 512，已经超过了阈值 256，因此对其进行扩容操作会采用的计算共识为 512 * (512 + 3\*256)/4 = 832
- 其次，在真正申请内存空间时，我们会根据切片元素大小乘以容量计算出所需的总空间大小，得出所需的空间为 8byte * 832 = 6656 byte
- 再进一步，结合分配内存的 mallocgc 流程，为了更好地进行内存空间对其，golang 允许产生一些有限的内部碎片，对拟申请空间的 object 进行大小补齐，最终 6656 byte 会被补齐到 6784 byte 的这一档次
- 再终，在 mallocgc 流程中，我们为扩容后的新切片分配到了 6784 byte 的空间，于是扩容后实际的新容量为 cap = 6784/8 = 848.

## 2 使用及原理

### 2.1 数据结构

Go 语言中的 Slice 具体实现如下：

```go
type slice struct {
    // 指向起点的地址
    array unsafe.Pointer
    // 切片长度
    len   int
    // 切片容量
    cap   int
}
```

- array：指向了内存空间地址的起点. 由于 slice 数据存放在连续的内存空间中，后续可以根据索引 index，在起点的基础上快速进行地址偏移，从而定位到目标元素
- len：切片的长度，指的是逻辑意义上 slice 中实际存放了多少个元素
- cap：切片的容量，指的是物理意义上为 slice 分配了足够用于存放多少个元素的空间. 使用 slice 时，要求 cap 永远大于等于 len

每个 slice header 中存放的是内存空间的地址（array 字段），后续在传递切片的时候，相当于是对 slice header 进行了一次值拷贝，但内部存放的地址是相同的，因此对于 slice 本身属于**引用传递**操作

### 2.2 初始化

- 声明但不初始化
	- 只是声明了 slice 的类型，但是并没有执行初始化操作，即 s 这个字面量此时是一个空指针 nil，并没有完成实际的内存分配操作.
	- `var s []int
- 基于 make 进行初始化
	- `s := make([]int,8)`将切片的长度 len 和 容量 cap 同时设置为 8. 需要注意，切片的长度一旦被指定了，就代表对应位置已经被分配了元素，尽管设置的会是对应元素类型下的零值.
	- `s := make([]int,8,16)` 在切片中设置了 8 个元素，会设置为对应类型的零值；cap = 16 代表为 slice 分配了用于存放 16 个元素的空间. 需要保证 cap >= len. 在 index 为 \[len, cap) 的范围内，虽然内存空间已经分配了，但是逻辑意义上不存在元素，直接访问会 panic 报数组访问越界；但是访问 \[0,len) 范围内的元素是能够正常访问到的，只不过会是对应元素类型下的零值.
- 初始化连带赋值
	-  `s := []int{2,3,4}` 将 slice 长度 len 和容量 cap 均设置为 3，同时完成对这 3 个元素赋值.

### 2.3 引用传递

- 引用传递，指的是，将实例的地址信息传递到方法中，这样在方法中会直接通过地址追溯到实例所在位置，因此执行的一些修改操作会直接影响到原实例.
- 值传递，指的是对实例进行一轮拷贝，得到一个副本，然后将这个副本传递到方法中. 这样在方法内部发生的修改动作都作用于这个副本之上，而副本本身和实例是相互独立的，因此不会影响到原实例.
-  slice 属于引用传递的类型

```go
func Test_slice(t *testing.T){
  s := []int{2,3,4}
  // [2,3,4] -> [-1,3,4]
  changeSlice(s)
}


func changeSlice(s []int){
  s[0] = -1
}
```

- 将主方法 Test_slice 中声明的切片 s 作为 changeSlice 方法的入参进行传递，同时在 changeSlice 方法中对 s 内的元素进行修改，这样是会直接影响到 Test_slice 中的切片 s 的.
- 每个切片实例对应一个 slice header，其中存储了三个字段：
	- 切片内存空间的起始地址 array；
	- 切片长度 len；
	- 以及切片容量 cap.
- 在方法间传递切片时，会对 slice header 实例本身进行一次值拷贝，然后将 slice header 的副本传递到局部方法中.
- 然而，这个 slice header 副本中的 array 和原 slice 指向同一片内存空间，因此在局部方法中执行修改操作时，还会根据这个地址信息影响到原 slice 所属的内存空间，从而对内容发生影响.


### 2.4 内容截取

可以修改 slice 下标的方式，进行 slice 内容的截取，形如 s\[a:b] 的格式，其中 a b 代表切片的索引 index，左闭右开，比如 s\[a:b] 对应的范围是 \[a,b)，代表的是取切片 slice index = a ~ index = b-1 范围的内容.

此外，这里的 a 和 b 是可以缺省的：
- 如果 a 缺省不填则默认取 0 ，则代表从切片起始位置开始截取. 比如 s\[:b] 等价于 s\[0:b]
- 如果 b 缺省不填，则默认取 len(s)，则代表末尾截取到切片长度 len 的终点，比如 s\[a:] 等价于 s\[a:len(s)]
- a 和 b 均缺省也是可以的，则代表截取整个切片长度的范围，比如 s\[:] 等价于 s\[0:len(s)]

在对切片 slice 执行截取操作时，本质上是一次**引用传递**操作，因为不论如何截取，底层复用的都是同一块内存空间中的数据，只不过，截取动作会创建出一个新的 slice header 实例.


### 2.5 元素追加

通过 append 操作，可以在 slice 末尾，额外新增一个元素. 需要注意，这里的末尾指的是针对 slice 的长度 len 而言. 这个过程中倘若发现 slice 的剩余容量已经不足了，则会对 slice 进行扩容.

```go
func Test_slice(t *testing.T){
    s := []int{2,3,4}  
    s = append(s,5)
    // s: [2,3,4,5]
}
```

在创建 slice 时，如果能够预估到其未来所需的容量空间，则应该提前分配好对应容量，避免在运行过程中频繁触发扩容操作，这样会对性能产生不利的影响.

### 2.6 切片扩容

当 slice 当前的长度 len 与容量 cap 相等时，下一次 append 操作就会引发一次切片扩容.

```go
    // len:4, cap: 4
    s := []int{2,3,4,5}
    // len:5, cap: 8    
    s = append(s,6)
```

**扩容流程**
- 倘若扩容后预期的新容量小于原切片的容量，则 panic
- 倘若切片元素大小为 0（元素类型为 struct{}），则直接复用一个全局的 zerobase 实例，直接返回
- 倘若预期的新容量超过老容量的两倍，则直接采用预期的新容量
- 倘若老容量小于 256，则直接采用老容量的2倍作为新容量
- 倘若老容量已经大于等于 256，则在老容量的基础上扩容 1/4 的比例并且累加上 192 的数值，持续这样处理，直到得到的新容量已经大于等于预期的新容量为止
- 结合 mallocgc 流程中，对内存分配单元 mspan 的等级制度，推算得到实际需要申请的内存空间大小
- 调用 mallocgc，对新切片进行内存初始化
- 调用 memmove 方法，将老切片中的内容拷贝到新切片中
- 返回扩容后的新切片

```go
func growslice(et *_type, old slice, cap int) slice {
    //... 
    if cap < old.cap {
        panic(errorString("growslice: cap out of range"))
    }


    if et.size == 0 {
        // 倘若元素大小为 0，则无需分配空间直接返回
        return slice{unsafe.Pointer(&zerobase), old.len, cap}
    }


    // 计算扩容后数组的容量
    newcap := old.cap
    // 取原容量两倍的容量数值
    doublecap := newcap + newcap
    // 倘若新的容量大于原容量的两倍，直接取新容量作为数组扩容后的容量
    if cap > doublecap {
        newcap = cap
    } else {
        const threshold = 256
        // 倘若原容量小于 256，则扩容后新容量为原容量的两倍
        if old.cap < threshold {
            newcap = doublecap
        } else {
            // 在原容量的基础上，对原容量 * 5/4 并且加上 192
            // 循环执行上述操作，直到扩容后的容量已经大于等于预期的新容量为止
            for 0 < newcap && newcap < cap {             
                newcap += (newcap + 3*threshold) / 4
            }
            // 倘若数值越界了，则取预期的新容量 cap 封顶
            if newcap <= 0 {
                newcap = cap
            }
        }
    }


    var overflow bool
    var lenmem, newlenmem, capmem uintptr
    // 基于容量，确定新数组容器所需要的内存空间大小 capmem
    switch {
    // 倘若数组元素的大小为 1，则新容量大小为 1 * newcap.
    // 同时会针对 span class 进行取整
    case et.size == 1:
        lenmem = uintptr(old.len)
        newlenmem = uintptr(cap)
        capmem = roundupsize(uintptr(newcap))
        overflow = uintptr(newcap) > maxAlloc
        newcap = int(capmem)
    // 倘若数组元素为指针类型，则根据指针占用空间结合元素个数计算空间大小
    // 并会针对 span class 进行取整
    case et.size == goarch.PtrSize:
        lenmem = uintptr(old.len) * goarch.PtrSize
        newlenmem = uintptr(cap) * goarch.PtrSize
        capmem = roundupsize(uintptr(newcap) * goarch.PtrSize)
        overflow = uintptr(newcap) > maxAlloc/goarch.PtrSize
        newcap = int(capmem / goarch.PtrSize)
    // 倘若元素大小为 2 的指数，则直接通过位运算进行空间大小的计算   
    case isPowerOfTwo(et.size):
        var shift uintptr
        if goarch.PtrSize == 8 {
            // Mask shift for better code generation.
            shift = uintptr(sys.Ctz64(uint64(et.size))) & 63
        } else {
            shift = uintptr(sys.Ctz32(uint32(et.size))) & 31
        }
        lenmem = uintptr(old.len) << shift
        newlenmem = uintptr(cap) << shift
        capmem = roundupsize(uintptr(newcap) << shift)
        overflow = uintptr(newcap) > (maxAlloc >> shift)
        newcap = int(capmem >> shift)
    // 兜底分支：根据元素大小乘以元素个数
    // 再针对 span class 进行取整     
    default:
        lenmem = uintptr(old.len) * et.size
        newlenmem = uintptr(cap) * et.size
        capmem, overflow = math.MulUintptr(et.size, uintptr(newcap))
        capmem = roundupsize(capmem)
        newcap = int(capmem / et.size)
    }




    // 进行实际的切片初始化操作
    var p unsafe.Pointer
    // 非指针类型
    if et.ptrdata == 0 {
        p = mallocgc(capmem, nil, false)
        // ...
    } else {
        // 指针类型
        p = mallocgc(capmem, et, true)
        // ...
    }
    // 将切片的内容拷贝到扩容后的位置 p 
    memmove(p, old.array, lenmem)
    return slice{p, old.len, newcap}
}
```

### 2.7 元素删除

从切片中删除元素的实现思路，本质上和切片内容截取的思路是一致的.
- 比如删除 slice 中的首个元素，在操作上等同于从切片 index = 1 开始向后进行内容截取
- 如果删除 slice 的尾部元素，则操作等价于截取切片内容，并将终点设置在 len(s) - 1 的位置
- 如果需要删除 slice 中间的某个元素，操作思路则是采用内容截取加上元素追加的复合操作，可以先截取待删除元素的左侧部分内容，然后在此基础上追加上待删除元素后侧部分的内容
- 当需要删除 slice 中的所有元素时，也可以采用切片内容截取的操作方式：s\[:0]. 这样操作后，slice header 中的指针 array 仍指向远处，但是逻辑意义上其长度 len 已经等于 0，而容量 cap 则仍保留为原值


### 2.8 切片拷贝

slice 的拷贝可以分为简单拷贝和完整拷贝两种类型

要实现简单拷贝，只需要对切片的字面量进行赋值传递即可，这样相当于创建出了一个新的 slice header 实例，但是其中的指针 array、容量 cap 和长度 len 仍和老的 slice header 实例相同.

slice 的完整复制，指的是会创建出一个和 slice 容量大小相等的独立的内存区域，并将原 slice 中的元素一一拷贝到新空间中

在实现上，slice 的完整复制可以调用系统方法 copy，代码示例如下，通过日志打印的方式可以看到，s 和 s1 的地址是相互独立的：

```go
func Test_slice(t *testing.T) {
    s := []int{0, 1, 2, 3, 4}
    s1 := make([]int, len(s))
    copy(s1, s)
    t.Logf("s: %v, s1: %v", s, s1)
    t.Logf("address of s: %p, address of s1: %p", s, s1)
}
```


## 3 与 String 互转

Slice 由 Data、Len、Cap 构成，String 由 Data、Len 构成，二者只相差了一个 Cap 属性。

通过 unsafe 包可以快速进行二者的转换。

```go
func String2Bytes(str string) []byte {
	sh := (*reflect.SliceHeader)(unsafe.Pointer(&str))
	// slice 比 string 多一个 cap 属性 这里给 cap 单独赋值
	sh.Cap = sh.Len
	return *(*[]byte)(unsafe.Pointer(sh))
}

func Bytes2String(buf []byte) string {
	return *(*string)(unsafe.Pointer(&buf))
}
```

Go 语言标准库中 strings.Builder 就使用到了 unsafe.Pointer 来提升效率。

```go
// strings/builder.go 47 行
func (b *Builder) String() string {
	return *(*string)(unsafe.Pointer(&b.buf))
}
```


## 4 .参考

`https://draveness.me/golang/docs/part2-foundation/ch03-datastructure/golang-array-and-slice/`

`https://blog.golang.org/slices-intro`