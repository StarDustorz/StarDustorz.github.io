---
title: "[Go] Context"
date: 2022-07-10
tags:
  - Golang
categories:
  - Golang
  - 并发编程
published: true
toc: "true"
comments: "true"
description:
---
> Context 主要用于在异步场景中用于实现并发协调以及对 goroutine 的生命周期控制. 除此之外，context 还兼有一定的数据存储能力.

<!--more-->
## 1 数据结构

### 1.1 context.Context

```go
type Context interface {
    Deadline() (deadline time.Time, ok bool)
    Done() <-chan struct{}
    Err() error
    Value(key interface{}) interface{}
}
```

- Context 包提供暴露 Context 接口; 
- 可以在多个 Goroutine 共享数据，实现多 Goroutine 管理机制; 
- Context 是协程安全的；

Context 接口定义了四个核心 api :
- Deadline 方法返回第一个参数是设置的截止时间，到时间Context会自动发起取消请求； 第二个参数是bool值，为false时表示没有设置截止时间，如果要取消需要调用取消函数;
- Done 方法返回一个只读 Channel，类型为 struct{}, 这个 Channel 会在当前工作完成或者上下文被取消之后关闭， 多次调用 Done 方法会返回同一个 Channel；
- Err 方法会返回当前 Context 结束的原因，它只会在 Done 返回的 Channel 被关闭时才会返回非空的值；
	- 如果当前 Context 被取消就会返回 Canceled 错误；
    - 如果当前 Context 超时就会返回 DeadlineExceeded 错误；
- Value 方法会从 Context 中返回键对应的值，对于同一个上下文来说，多次调用 Value 并传入相同的 Key 会返回相同的结果，这个功能可以用来传递请求特定的数据；获取Value值时是线程安全的； key 必须为非空，且可比较;

### 1.2 标准 error

```go
var Canceled = errors.New("context canceled")

var DeadlineExceeded error = deadlineExceededError{}

type deadlineExceededError struct{}

func (deadlineExceededError) Error() string   { return "context deadline exceeded" }
func (deadlineExceededError) Timeout() bool   { return true }
func (deadlineExceededError) Temporary() bool { return true
```
- Canceled：context 被 cancel 时会报此错误；
- DeadlineExceeded：context 超时时会报此错误.

## 2 emptyCtx

### 2.1 类实现

```go
type emptyCtx int

func (*emptyCtx) Deadline() (deadline time.Time, ok bool) {
    return
}

func (*emptyCtx) Done() <-chan struct{} {
    return nil
}

func (*emptyCtx) Err() error {
    return nil
}

func (*emptyCtx) Value(key any) any {
    return nil
}
```

- emptyCtx 是一个不可取消，没有设置截止时间，没有携带任何值的Context;
- emptyCtx 是一个空的 context，本质上类型为一个整型；
- Deadline 方法会返回一个公元元年时间以及 false 的 flag，标识当前 context 不存在过期时间；
- Done 方法返回一个 nil 值，用户无论往 nil 中写入或者读取数据，均会陷入阻塞；
- Err 方法返回的错误永远为 nil；
- Value 方法返回的 value 同样永远为 nil.

### 2.2 context.Background() & context.TODO()

```go
var (
    background = new(emptyCtx)
    todo       = new(emptyCtx)
)

func Background() Context {
    return background
}

func TODO() Context {
    return todo
}
```

- 内置2个Context实现,通常用来做顶层的parent context; TODO一般在不知道使用什么Context时使用；
- todo 和 background 两者本质上只有名字区别，在按 string 输出的时候会有区别; 
- context.Background() 和 context.TODO() 方法返回的均是 emptyCtx 类型的一个实例

## 3  cancelCtx

### 3.1 cancelCtx 数据结构

```go
type cancelCtx struct {
    Context

    mu       sync.Mutex            // protects following fields
    done     atomic.Value          // of chan struct{}, created lazily, closed by first cancel call
    children map[canceler]struct{} // set to nil by the first cancel call
    err      error                 // set to non-nil by the first cancel call
}

type canceler interface {
    cancel(removeFromParent bool, err error)
    Done() <-chan struct{}
}
```

• embed 了一个 context 作为其父 context. cancelCtx 必然为某个 context 的子 context；
• 内置了一把锁，用以协调并发场景下的资源获取；
• done：实际类型为 chan struct{}，即用以反映 cancelCtx 生命周期的通道；
• children：一个 set，指向 cancelCtx 的所有子 context；
• err：记录了当前 cancelCtx 的错误. 必然为某个 context 的子 context；

### 3.2 Deadline 方法

cancelCtx 未实现该方法，仅是 embed 了一个带有 Deadline 方法的 Context interface，因此直接调用会报错.

### 3.3 Done 方法

```go
func (c *cancelCtx) Done() <-chan struct{} {
    d := c.done.Load()
    if d != nil {
        return d.(chan struct{})
    }
    c.mu.Lock()
    defer c.mu.Unlock()
    d = c.done.Load()
    if d == nil {
        d = make(chan struct{})
        c.done.Store(d)
    }
    return d.(chan struct{})
}
```

• 基于 atomic 包，读取 cancelCtx 中的 chan；倘若已存在，则直接返回；
• 加锁后，在此检查 chan 是否存在，若存在则返回；（double check）
• 初始化 chan 存储到 aotmic.Value 当中，并返回.（懒加载机制）

### 3.4 Err 方法

```go
func (c *cancelCtx) Err() error {
    c.mu.Lock()
    err := c.err
    c.mu.Unlock()
    return err
}
```

• 加锁；
• 读取 cancelCtx.err；
• 解锁；
• 返回结果.

### 3.5  Value 方法

```go
func (c *cancelCtx) Value(key any) any {
    if key == &cancelCtxKey {
        return c
    }
    return value(c.Context, key)
}
```

• 倘若 key 特定值 &cancelCtxKey，则返回 cancelCtx 自身的指针；
• 否则遵循 valueCtx 的思路取值返回

### 3.6 context.WithCancel()

#### 3.6.1 context.WithCancel()

```go
func WithCancel(parent Context) (ctx Context, cancel CancelFunc) {
    if parent == nil {
        panic("cannot create context from nil parent")
    }
    c := newCancelCtx(parent)
    propagateCancel(parent, &c)
    return &c, func() { c.cancel(true, Canceled) }
}
```

• 校验父 context 非空；
• 注入父 context 构造好一个新的 cancelCtx；
• 在 propagateCancel 方法内启动一个守护协程，以保证父 context 终止时，该 cancelCtx 也会被终止；
• 将 cancelCtx 返回，连带返回一个用以终止该 cancelCtx 的闭包函数.

#### 3.6.2 newCancelCtx

```go
func newCancelCtx(parent Context) cancelCtx {
    return cancelCtx{Context: parent}
}
```

• 注入父 context 后，返回一个新的 cancelCtx.

#### 3.6.3 propagateCancel

```go
func propagateCancel(parent Context, child canceler) {
    done := parent.Done()
    if done == nil {
        return // parent is never canceled
    }

    select {
    case <-done:
        // parent is already canceled
        child.cancel(false, parent.Err())
        return
    default:
    }

    if p, ok := parentCancelCtx(parent); ok {
        p.mu.Lock()
        if p.err != nil {
            // parent has already been canceled
            child.cancel(false, p.err)
        } else {
            if p.children == nil {
                p.children = make(map[canceler]struct{})
            }
            p.children[child] = struct{}{}
        }
        p.mu.Unlock()
    } else {
        atomic.AddInt32(&goroutines, +1)
        go func() {
            select {
            case <-parent.Done():
                child.cancel(false, parent.Err())
            case <-child.Done():
            }
        }()
    }
}
```

propagateCancel 方法传递父子 context 之间的 cancel 事件：
• 倘若 parent 是不会被 cancel 的类型（如 emptyCtx），则直接返回；
• 倘若 parent 已经被 cancel，则直接终止子 context，并以 parent 的 err 作为子 context 的 err；
• 假如 parent 是 cancelCtx 的类型，则加锁，并将子 context 添加到 parent 的 children map 当中；
• 假如 parent 不是 cancelCtx 类型，但又存在 cancel 的能力（比如用户自定义实现的 context），则启动一个协程，通过多路复用的方式监控 parent 状态，倘若其终止，则同时终止子 context，并透传 parent 的 err.


**校验 parent 是否为 cancelCtx 的类型**

```go
func parentCancelCtx(parent Context) (*cancelCtx, bool) {
    done := parent.Done()
    if done == closedchan || done == nil {
        return nil, false
    }
    p, ok := parent.Value(&cancelCtxKey).(*cancelCtx)
    if !ok {
        return nil, false
    }
    pdone, _ := p.done.Load().(chan struct{})
    if pdone != done {
        return nil, false
    }
    return p, true
}
```
• 倘若 parent 的 channel 已关闭或者是不会被 cancel 的类型，则返回 false；
• 倘若以特定的 cancelCtxKey 从 parent 中取值，取得的 value 是 parent 本身，则返回 true. （基于 cancelCtxKey 为 key 取值时返回 cancelCtx 自身，是 cancelCtx 特有的协议）.


## 4 timerCtx

### 4.1 类实现

- timerCtx 内部不仅通过嵌入 cancelCtx 的方式承了相关的变量和方法，还通过持有的定时器 `timer` 和截止时间 `deadline` 实现了定时取消的功能：

```go
type timerCtx struct {
	cancelCtx
	timer *time.Timer // Under cancelCtx.mu.

	deadline time.Time
}
```

### 4.2 timerCtx.Deadline()

```go
func (c *timerCtx) Deadline() (deadline time.Time, ok bool) {
	return c.deadline, true
}
```

- context.Context interface 下的 Deadline api 仅在 timerCtx 中有效，由于展示其过期时间.
### 4.3 timerCtx.cancel

```go
func (c *timerCtx) cancel(removeFromParent bool, err error) {
	c.cancelCtx.cancel(false, err)
	if removeFromParent {
		removeChild(c.cancelCtx.Context, c)
	}
	c.mu.Lock()
	if c.timer != nil {
		c.timer.Stop()
		c.timer = nil
	}
	c.mu.Unlock()
}
```

- timerCtx.cancel 不仅调用了 cancelCtx.cancel 方法，还会停止持有的定时器减少不必要的资源浪费。
- 实际上对外提供了 WithTimeout 方法只是 WithDeadline 的封装

### 4.4 context.WithTimeout & context.WithDeadline

```go
func WithTimeout(parent Context, timeout time.Duration) (Context, CancelFunc) {
	return WithDeadline(parent, time.Now().Add(timeout))
}


func WithDeadline(parent Context, d time.Time) (Context, CancelFunc) {
	if parent == nil {
		panic("cannot create context from nil parent")
	}
	if cur, ok := parent.Deadline(); ok && cur.Before(d) {
		return WithCancel(parent)
	}
	c := &timerCtx{
		cancelCtx: newCancelCtx(parent),
		deadline:  d,
	}
	propagateCancel(parent, c)
	dur := time.Until(d)
	if dur <= 0 {
		c.cancel(true, DeadlineExceeded) // deadline has already passed
		return c, func() { c.cancel(false, Canceled) }
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.err == nil {
		c.timer = time.AfterFunc(dur, func() {
			c.cancel(true, DeadlineExceeded)
		})
	}
	return c, func() { c.cancel(true, Canceled) }
}
```

• 校验 parent context 非空；
• 校验 parent 的过期时间是否早于自己，若是，则构造一个 cancelCtx 返回即可；
• 构造出一个新的 timerCtx；
• 启动守护方法，同步 parent 的 cancel 事件到子 context；
• 判断过期时间是否已到，若是，直接 cancel timerCtx，并返回 DeadlineExceeded 的错误；
• 加锁；
• 启动 time.Timer，设定一个延时时间，即达到过期时间后会终止该 timerCtx，并返回 DeadlineExceeded 的错误；
• 解锁；
• 返回 timerCtx，已经一个封装了 cancel 逻辑的闭包 cancel 函数.

## 5 valueCtx
### 5.1 类实现

```go
type valueCtx struct {
	Context
	key, val interface{}
}
```

• valueCtx 同样继承了一个 parent context；
• 一个 valueCtx 中仅有一组 kv 对.

### 5.2 valueCtx.Value()

```go
func (c *valueCtx) Value(key any) any {
    if c.key == key {
        return c.val
    }
    return value(c.Context, key)
}
```

• 假如当前 valueCtx 的 key 等于用户传入的 key，则直接返回其 value；
• 假如不等，则从 parent context 中依次向上寻找.

```go
func value(c Context, key any) any {
    for {
        switch ctx := c.(type) {
        case *valueCtx:
            if key == ctx.key {
                return ctx.val
            }
            c = ctx.Context
        case *cancelCtx:
            if key == &cancelCtxKey {
                return c
            }
            c = ctx.Context
        case *timerCtx:
            if key == &cancelCtxKey {
                return &ctx.cancelCtx
            }
            c = ctx.Context
        case *emptyCtx:
            return nil
        default:
            return c.Value(key)
        }
    }
}
```

- 启动一个 for 循环，由下而上，由子及父，依次对 key 进行匹配；
- 其中 cancelCtx、timerCtx、emptyCtx 类型会有特殊的处理方式；
- 找到匹配的 key，则将该组 value 进行返回.
- 最终找到根节点（一般是 emptyCtx），直接返回一个 nil。所以用 Value 方法的时候要判断结果是否为 nil。

### 5.3 valueCtx 用法小结

valueCtx 不适合视为存储介质，存放大量的 kv 数据
- 一个 valueCtx 实例只能存一个 kv 对，因此 n 个 kv 对会嵌套 n 个 valueCtx，造成空间浪费；
- 基于 k 寻找 v 的过程是线性的，时间复杂度 O(N)；
- 不支持基于 k 的去重，相同 k 可能重复存在，并基于起点的不同，返回不同的 v. 由此得知，valueContext 的定位类似于请求头，只适合存放少量作用域较大的全局 meta 数据.

### 5.4 context.WithValue()

```go
func WithValue(parent Context, key, val any) Context {
    if parent == nil {
        panic("cannot create context from nil parent")
    }
    if key == nil {
        panic("nil key")
    }
    if !reflectlite.TypeOf(key).Comparable() {
        panic("key is not comparable")
    }
    return &valueCtx{parent, key, val}
}
```

- parent context 为空，panic；
- key 为空 panic；
- key 的类型不可比较，panic；
- 包括 parent context 以及 kv对，返回一个新的 valueCtx.

## 6 使用原则

1. 不要把 Context 放在结构体中，要以参数的方式传递
2. 以 Context 作为参数的函数方法，应该把 Context 作为第一个参数，放在第一位。
3. 给一个函数方法传递 Context 的时候，不要传递 nil，如果不知道传递什么，就使用 context.TODO
4. Context 的 Value 相关方法应该传递必须的数据，不要什么数据都使用这个传递
5. Context 是线程安全的，可以放心的在多个 goroutine 中传递
6. 在子 Context 被传递到的 goroutine 中，应该对该子 Context 的 Done（channel）进行监控

## 7 Context Demo

### 7.1 Context控制多个goroutine

```go
func main() {
    ctx, cancel := context.WithCancel(context.Background())
    valueCtx1 := context.WithValue(ctx, "key", "goroutine 1")
    valueCtx2 := context.WithValue(ctx, "key", "goroutine 2")
    valueCtx3 := context.WithValue(ctx, "key", "goroutine 3")
    go watch(valueCtx1)
    go watch(valueCtx2)
    go watch(valueCtx3)

    time.Sleep(10 * time.Second)
    fmt.Println("cancel ", ctx.String())
    cancel()
    time.Sleep(5 * time.Second)
}

func watch(ctx context.Context) {
    for {
        select {
        case <-ctx.Done():
            fmt.Println(ctx.String() ," done", ctx.Err())
            return
        default:
            fmt.Println(ctx.Value("key"), "wait...")
            time.Sleep(2 * time.Second)
        }
    }
}
```

### 7.2 Context http请求超时

```go
func main() {
    // 创建一个超时时间为100毫秒的上下文
    ctx := context.Background()
    ctx, _ = context.WithTimeout(ctx, 100*time.Millisecond)
    
    // 创建一个访问Google主页的请求
    req, _ := http.NewRequest(http.MethodGet, "http://google.com", nil)
    // 将超时上下文关联到创建的请求上
    req = req.WithContext(ctx)
    
    // 创建一个HTTP客户端并执行请求
    client := &http.Client{}
    res, err := client.Do(req)
    // 如果请求失败了，记录到STDOUT
    if err != nil {
        fmt.Println("Request failed:", err)
        return
    }
    // 请求成功后打印状态码
    fmt.Println("Response received, status code:", res.StatusCode)
}
```

### 7.3 Context http服务器

```go
func main() {
    // 创建一个监听8000端口的服务器
    http.ListenAndServe(":8000", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    // 输出到STDOUT展示处理已经开始
    fmt.Fprint(os.Stdout, "processing request\n")
    // 通过select监听多个channel
    select {
    case <-time.After(2 * time.Second):
        // 如果两秒后接受到了一个消息后，意味请求已经处理完成
        // 我们写入"request processed"作为响应
        w.Write([]byte("request processed"))
    case <-ctx.Done():
        // 如果处理完成前取消了，在STDERR中记录请求被取消的消息
        fmt.Fprint(os.Stderr, "request cancelled\n")
    }
    }))
}
```

### 7.4 Context 超时控制多个goroutine

```go
func worker(ctx context.Context, wg *sync.WaitGroup) error {
    defer wg.Done()

    for {
        select {
        case <-ctx.Done():
            fmt.Println("Timeout ", ctx.Err())
            return ctx.Err()
        }
    }
}

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)

    var wg sync.WaitGroup
    for i := 0; i < 10; i++ {
        wg.Add(1)
        go worker(ctx, &wg)
    }

    time.Sleep(time.Second)
    cancel()

    wg.Wait()
}
```

### 7.5 Context 取消控制多个goroutine

```go
func work1(ctx context.Context) error {
    // 假设这个操作会因为某种原因失败
    // 使用time.Sleep来模拟一个资源密集型操作
    time.Sleep(100 * time.Millisecond)
    return errors.New("failed")
}

func work2(ctx context.Context) {
    select {
    case <-time.After(500 * time.Millisecond):
        fmt.Println("done")
    case <-ctx.Done():
        fmt.Println("halted work2")
    }
}

func main() {
    ctx := context.Background()
    // cancel context
    ctx, cancel := context.WithCancel(ctx)
    // 在不同的goroutine中运行work2
    go func() {
        work2(ctx)
    }()
    go func() {
        work2(ctx)
    }()

    err := work1(ctx)
    // 如果这个操作返回错误，取消所有使用相同Context的操作
    if err != nil {
        //发出取消事件
        cancel()
    }
    time.Sleep(100 * time.Millisecond)
}
```

### 7.6 Context 控制后台goroutine 生成素数

```go
package main

import (
    "context"
    "fmt"
)

// 返回生成自然数序列的管道: 2, 3, 4, ...
func GenerateNatural(ctx context.Context) chan int {
    ch := make(chan int)
    go func() {
        for i := 2; ; i++ {
            select {
            case <-ctx.Done(): // 结束生成自然数
                return
            case ch <- i:
            }
        }
    }()
    return ch
}

// 管道过滤器: 删除能被素数整除的数
func PrimeFilter(ctx context.Context, in <-chan int, prime int) chan int {
    out := make(chan int)
    go func() {
        for {
            if i := <-in; i%prime != 0 {
                select {
                case <-ctx.Done(): // 结束过滤器
                    return
                case out <- i:
                }
            }
        }
    }()
    return out
}

func main() {
    // 通过 Context 控制后台Goroutine状态
    ctx, cancel := context.WithCancel(context.Background())

    ch := GenerateNatural(ctx) // 自然数序列: 2, 3, 4, ...
    for i := 0; i < 10; i++ {
        prime := <-ch // 新出现的素数
        fmt.Printf("%v: %v\n", i+1, prime)
        ch = PrimeFilter(ctx, ch, prime) // 基于新素数构造的过滤器
    }
    cancel()
}
```

## 8 参考

- https://pkg.go.dev/context
- https://faiface.github.io/post/context-should-go-away-go2/
- https://draveness.me/golang/docs/part3-runtime/ch06-concurrency/golang-context/
- https://blog.csdn.net/qq_36183935/article/details/81137834
- https://blog.csdn.net/u011957758/article/details/82948750
- https://www.jianshu.com/p/e5df3cd0708bhttps://zhuanlan.zhihu.com/p/68792989