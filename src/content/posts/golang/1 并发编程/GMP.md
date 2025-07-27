---
title: "[Go] GMP"
published: 2022-07-03
tags:
  - Golang
  - Go并发编程
lang: zh
toc: true
abbrlink: golang-gmp
draft: false
---
> gmp = goroutine + machine + processor

<!--more-->

## 1 概念

### 1.1 线程

通常指的是内核级线程，核心点如下：
- 是操作系统最小调度单元；
- 创建、销毁、调度交由内核完成，cpu 需完成用户态与内核态间的切换；
- 可充分利用多核，实现并行.
### 1.2 协程

协程，又称为用户级线程，核心点如下：
- 与线程存在映射关系，为 M：1；
- 创建、销毁、调度在用户态完成，对内核透明，所以更轻；
- 从属同一个内核级线程，无法并行；一个协程阻塞会导致从属同一线程的所有协程无法执行.

### 1.3 Goroutine

Goroutine，经 Golang 优化后的特殊“协程”，特点如下：
- 与线程存在映射关系，为 M：N；
- 创建、销毁、调度在用户态完成，对内核透明，足够轻便；
- 可利用多个线程，实现并行；
- 通过调度器的，实现和线程间的动态绑定和灵活调度；
- 栈空间大小可动态扩缩.

### 1.4 对比
| **模型**    | **弱依赖内核** | **可并行** | **可应对阻塞** | **栈可动态扩缩** |
| --------- | --------- | ------- | --------- | ---------- |
| 线程        | ❎         | ✅       | ✅         | ❎          |
| 协程        | ✅         | ❎       | ❎         | ❎          |
| goroutine | ✅         | ✅       | ✅         | ✅          |

## 2 GMP 模型

### 2.1 g

- g 即goroutine，是 golang 中对协程的抽象
- g 有自己的运行栈、状态、以及执行的任务函数（用户通过 go func 指定）
- g 需要绑定到 p 才能执行，在 g 的视角中，p 就是它的 cpu

### 2.2 m

- m 即 machine，是 golang 中对线程的抽象
- m 不直接执行 g，而是先和 p 绑定，由其实现代理
- 借由 p 的存在，m 无需和 g 绑死，也无需记录 g 的状态信息，因此 g 在全生命周期中可以实现跨 m 执行.

### 2.3 p

- p 即 processor，是 golang 中的调度器
- p 是 gmp 的中枢，借由 p 承上启下，实现 g 和 m 之间的动态有机结合
- 对 g 而言，p 是其 cpu，g 只有被 p 调度，才得以执行
- 对 m 而言，p 是其执行代理，为其提供必要信息的同时（可执行的 g、内存分配情况等），并隐藏了繁杂的调度细节
- p 的数量决定了 g 最大并行数量，可由用户通过 GOMAXPROCS 进行设定（超过 CPU 核数时无意义）

### 2.4 GMP

- M 是线程的抽象；G 是 goroutine；P 是承上启下的调度器；
- M调度G前，需要和P绑定；
- 全局有多个M和多个P，但同时并行的G的最大数量等于P的数量；
- G的存放队列有三类：P的本地队列；全局队列；和wait队列（图中未展示，为io阻塞就绪态goroutine队列）；
- M调度G时，优先取P本地队列，其次取全局队列，最后取wait队列；这样的好处是，取本地队列时，可以接近于无锁化，减少全局锁竞争；
- 为防止不同P的闲忙差异过大，设立work-stealing机制，本地队列为空的P可以尝试从其他P本地队列偷取一半的G补充到自身队列.

## 3 核心数据结构

> gmp 数据结构定义在 runtime/runtime2.go 文件中

### 3.1 g

```go
type g struct {
    // ...
    m         *m      
    // ...
    sched     gobuf
    // ...
}


type gobuf struct {
    sp   uintptr
    pc   uintptr
    ret  uintptr
    bp   uintptr // for framepointer-enabled architectures
}
```

- m：在 p 的代理，负责执行当前 g 的 m；
- sched.sp：保存 CPU 的 rsp 寄存器的值，指向函数调用栈栈顶；
- sched.pc：保存 CPU 的 rip 寄存器的值，指向程序下一条执行指令的地址；
- sched.ret：保存系统调用的返回值；
- sched.bp：保存 CPU 的 rbp 寄存器的值，存储函数栈帧的起始位置.

g的生命周期:未初始化完成 等待被执行  执行  执行系统调用  挂起态  被销毁  栈扩容 被抢占

### 3.2 m

```go
type m struct {
    g0      *g     // goroutine with scheduling stack
    // ...
    tls           [tlsSlots]uintptr // thread-local storage (for x86 extern register)
    // ...
}
```

- g0：一类特殊的调度协程，不用于执行用户函数，负责执行 g 之间的切换调度. 与 m 的关系为 1:1；
- tls：thread-local storage，线程本地存储，存储内容只对当前线程可见. 线程本地存储的是 m.tls 的地址，m.tls[0] 存储的是当前运行的 g，因此线程可以通过 g 找到当前的 m、p、g0 等信息.
### 3.3 p

```go
type p struct {
    // ...
    runqhead uint32
    runqtail uint32
    runq     [256]guintptr
    
    runnext guintptr
    // ...
}
```

- runq：本地 goroutine 队列，最大长度为 256.
- runqhead：队列头部；
- runqtail：队列尾部；
- runnext：下一个可执行的 goroutine.

### 3.4 schedt

```go
type schedt struct {
    // ...
    lock mutex
    // ...
    runq     gQueue
    runqsize int32
    // ...
}
```

sched 是全局 goroutine 队列的封装：
- lock：一把操作全局队列时使用的锁；
- runq：全局 goroutine 队列；
- runqsize：全局 goroutine 队列的容量.

## 4 调度流程

### 4.1 g0 和 g 的转换

**goroutine 的类型可分为两类：**
- 负责调度普通 g 的 g0，执行固定的调度流程，与 m 的关系为一对一
- 负责执行用户函数的普通 g
m 通过 p 调度执行的 goroutine 永远在普通 g 和 g0 之间进行切换，当 g0 找到可执行的 g 时，会调用 gogo 方法，调度 g 执行用户定义的任务；当 g 需要主动让渡或被动调度时，会触发 mcall 方法，将执行权重新交还给 g0.


### 4.2 调度类型

>调度器 p 实现从执行一个 g 切换到另一个 g 的过程.

#### 4.2.1 主动调度

- 用户主动执行让渡的方式，主要方式是，用户在执行代码中调用了 runtime.Gosched 方法，此时当前 g 会当让出执行权，主动进行队列等待下次被调度执行.

#### 4.2.2 被动调度

- 因当前不满足某种执行条件，g 可能会陷入阻塞态无法被调度，直到关注的条件达成后，g才从阻塞中被唤醒，重新进入可执行队列等待被调度.
- 常见的被动调度触发方式为因 channel 操作或互斥锁操作陷入阻塞等操作，底层会走进 gopark 方法.
#### 4.2.3 正常调度

- g 中的执行任务已完成，g0 会将当前 g 置为死亡状态，发起新一轮调度.
#### 4.2.4 抢占调度

- 如果 g 执行系统调用超过指定的时长，且全局的 p 资源比较紧缺，此时将 p 和 g 解绑，抢占出来用于其他 g 的调度. 等 g 完成系统调用后，会重新进入可执行队列中等待被调度.
- 前 3 种调度方式都由 m 下的 g0 完成，唯独抢占调度不同.
- 因为发起系统调用时需要打破用户态的边界进入内核态，此时 m 也会因系统调用而陷入僵直，无法主动完成抢占调度的行为.
- 因此，在 Golang 进程会有一个全局监控协程 monitor g 的存在，这个 g 会越过 p 直接与一个 m 进行绑定，不断轮询对所有 p 的执行状况进行监控. 倘若发现满足抢占调度的条件，则会从第三方的角度出手干预，主动发起该动作.

### 4.3 宏观调度流程

- g0 执行 schedule() 函数，寻找到用于执行的 g
- g0 执行 execute() 方法，更新当前 g、p 的状态信息，并调用 gogo() 方法，将执行权交给 g
- g 因主动让渡( gosche_m() )、被动调度( park_m() )、正常结束( goexit0() )等原因，调用 m_call 函数，执行权重新回到 g0 手中
- g0 执行 schedule() 函数，开启新一轮循环

### 4.4 schedule

调度流程的主干方法是位于 runtime/proc.go 中的 schedule 函数，此时的执行权位于 g0 手中：
```go
func schedule() {
    // ...
    gp, inheritTime, tryWakeP := findRunnable() // blocks until work is available

    // ...
    execute(gp, inheritTime)
}
```

- 寻找到下一个执行的 goroutine
- 执行该 goroutine

### 4.5 findRunnable


```go
func findRunnable() (gp *g, inheritTime, tryWakeP bool) {
    _g_ := getg()


top:
    _p_ := _g_.m.p.ptr()
    // ...
    if _p_.schedtick%61 == 0 && sched.runqsize > 0 {
        lock(&sched.lock)
        gp = globrunqget(_p_, 1)
        unlock(&sched.lock)
        if gp != nil {
            return gp, false, false
        }
    }
    
    // ...
    if gp, inheritTime := runqget(_p_); gp != nil {
        return gp, inheritTime, false
    }
    
    // ...
    if sched.runqsize != 0 {
        lock(&sched.lock)
        gp := globrunqget(_p_, 0)
        unlock(&sched.lock)
        if gp != nil {
            return gp, false, false
        }
    }

    if netpollinited() && atomic.Load(&netpollWaiters) > 0 && atomic.Load64(&sched.lastpoll) != 0 {
        if list := netpoll(0); !list.empty() { // non-blocking
            gp := list.pop()
            injectglist(&list)
            casgstatus(gp, _Gwaiting, _Grunnable)
            return gp, false, false
        }
    }

    // ...
    procs := uint32(gomaxprocs)
    if _g_.m.spinning || 2*atomic.Load(&sched.nmspinning) < procs-atomic.Load(&sched.npidle) {
        if !_g_.m.spinning {
            _g_.m.spinning = true
            atomic.Xadd(&sched.nmspinning, 1)
        }

        gp, inheritTime, tnow, w, newWork := stealWork(now)
        now = tnow
        if gp != nil {
            // Successfully stole.
            return gp, inheritTime, false
        }
        if newWork {
            // There may be new timer or GC work; restart to
            // discover.
            goto top
        }
        if w != 0 && (pollUntil == 0 || w < pollUntil) {
            // Earlier timer to wait for.
            pollUntil = w
        }
    }
```

- p 每执行 61 次调度，会从全局队列中获取一个 goroutine 进行执行，并将一个全局队列中的 goroutine 填充到当前 p 的本地队列中
	- 取得 p 本地队列队首的索引，同时对本地队列加锁
	- 倘若 p 的局部队列未满，则成功转移 g，将 p 的对尾索引 runqtail 值加 1 并解锁队列.
	- 倘若发现本地队列 runq 已经满了，则会返回来将本地队列中一半的 g 放回全局队列中，帮助当前 p 缓解执行压力，这部分内容位于 runqputslow 方法中
- 尝试从 p 本地队列中获取一个可执行的 goroutine，核心逻辑位于 runqget 方法中
	- 倘若当前 p 的 runnext 非空，直接获取即可
	- 加锁从 p 的本地队列中获取 g, 虽然本地队列是属于 p 独有的，但是由于 work-stealing 机制的存在，其他 p 可能会前来执行窃取动作，因此操作仍需加锁.
	- 倘若本地队列为空，直接终止并返回
	- 倘若本地队列存在 g，则取得队首的 g，解锁并返回
- 倘若本地队列没有可执行的 g，会从全局队列中获取
- 倘若本地队列和全局队列都没有 g，则会获取准备就绪的网络协程
- work-stealing: 从其他 p 中偷取 g
	- 偷取操作至多会遍历全局的 p 队列 4 次，过程中只要找到可窃取的 p 则会立即返回.
	- 为保证窃取行为的公平性，遍历的起点是随机的. 窃取动作的核心逻辑位于 runqgrab 方法当中
	- 每次对一个 p 尝试窃取前，会对其局部队列加锁
	- 尝试偷取其现有的一半 g，并且返回实际偷取的数量

### 4.6 execute

当 g0 为 m 寻找到可执行的 g 之后，接下来就开始执行 g. 这部分内容位于 runtime/proc.go 的 execute 方法中
- 更新 g 的状态信息，建立 g 与 m 之间的绑定关系
- 更新 p 的总调度次数
- 调用 gogo 方法，执行 goroutine 中的任务

### 4.7 gosched_m

g 执行主动让渡时，会调用 mcall 方法将执行权归还给 g0，并由 g0 调用 gosched_m 方法，位于 runtime/proc.go 文件中

- 将当前 g 的状态由执行中切换为待执行 `_Grunnable`
- 调用 dropg() 方法，将当前的 m 和 g 解绑
- 将 g 添加到全局队列当中
- 开启新一轮的调度

### 4.8 park_m 与 ready

- g 需要被动调度时，会调用 mcall 方法切换至 g0，并调用 park_m 方法将 g 置为阻塞态，执行流程位于 runtime/proc.go 的 gopark 方法当中
	- 将当前 g 的状态由 running 改为 waiting
	- 将 g 与 m 解绑
	- 执行新一轮的调度 schedule
- 当因被动调度陷入阻塞态的 g 需要被唤醒时，会由其他协程执行 goready 方法将 g 重新置为可执行的状态，方法位于 runtime/proc.go
	- 先将 g 的状态从阻塞态改为可执行的状态
	- 调用 runqput 将当前 g 添加到唤醒者 p 的本地队列中，如果队列满了，会连带 g 一起将一半的元素转移到全局队列

### 4.9 goexit0

- 当 g 执行完成时，会先执行 mcall 方法切换至 g0，然后调用 goexit0 方法
	- 将 g 状态置为 dead
	- 解绑 g 和 m
	- 开启新一轮的调度


### 4.10 retake

抢占调度的执行者不是 g0，而是一个全局的 monitor g，代码位于 runtime/proc.go 的 retake 方法中
```go
func retake(now int64) uint32 {
    n := 0
    
    lock(&allpLock)
    for i := 0; i < len(allp); i++ {
        _p_ := allp[i]
        if _p_ == nil {
            // This can happen if procresize has grown
            // allp but not yet created new Ps.
            continue
        }
        pd := &_p_.sysmontick
        // ...
        if s == _Psyscall {            
            // ...
            if runqempty(_p_) && atomic.Load(&sched.nmspinning)+atomic.Load(&sched.npidle) > 0 && pd.syscallwhen+10*1000*1000 > now {
                continue
            }
            unlock(&allpLock)
            if atomic.Cas(&_p_.status, s, _Pidle) {
                n++
                _p_.syscalltick++
                handoffp(_p_)
            }
            incidlelocked(1)
            lock(&allpLock)
        }
    }
    unlock(&allpLock)
    return uint32(n)
}
```

- 加锁后，遍历全局的 p 队列，寻找需要被抢占的目标
- 倘若某个 p 同时满足下述条件，则会进行抢占调度
	- 执行系统调用超过 10 ms
	- p 本地队列有等待执行的 g
	- 或者当前没有空闲的 p 和 m
- 抢占调度的步骤是，先将当前 p 的状态更新为 idle，然后步入 handoffp 方法中，判断是否需要为 p 寻找接管的 m（因为其原本绑定的 m 正在执行系统调用）
- 当以下条件满足其一时，则需要为 p 获取新的 m
	- 当前 p 本地队列还有待执行的 g
	- 全局繁忙（没有空闲的 p 和 m，全局 g 队列为空）
	- 需要处理网络 socket 读写请求
- 获取 m 时，会先尝试获取已有的空闲的 m，若不存在，则会创建一个新的 m

### 4.11 reentersyscall 和 exitsyscall

在 m 需要执行系统调用前，会先执行位于 runtime/proc.go 的 reentersyscall 的方法
- 此时执行权同样位于 m 的 g0 手中
- 保存当前 g 的执行环境
- 将 g 和 p 的状态更新为 syscall
- 解除 p 和 当前 m 之间的绑定，因为 m 即将进入系统调用而导致短暂不可用
- 将 p 添加到 当前 m 的 oldP 容器当中，后续 m 恢复后，会优先寻找旧的 p 重新建立绑定关系

当 m 完成了内核态的系统调用之后，此时会步入位于 runtime/proc.go 的 exitsyscall 函数中，尝试寻找 p 重新开始运作
- 方法执行之初，此时的执行权是普通 g.倘若此前设置的 oldp 仍然可用，则重新和 oldP 绑定，将当前 g 重新置为 running 状态，然后开始执行后续的用户函数
- old 绑定失败，则调用 mcall 方法切换到 m 的 g0，并执行 exitsyscall0 方法
- 将 g 由系统调用状态切换为可运行态，并解绑 g 和 m 的关系
- 从全局 p 队列获取可用的 p，如果获取到了，则执行 g
- 如若无 p 可用，则将 g 添加到全局队列，当前 m 陷入沉睡. 直到被唤醒后才会继续发起调度.