---
abbrlink: golang-timerate
published: 2021-10-11
tags:
- Golang
- Packges
title: Golang Time/rate使用
---

> Time/rate 是基于 Token Bucket (令牌桶) 算法实现的限流

<!--more-->

## 1 限流

限制某个服务每秒的调用本服务的频率 客户端请求太多，超出服务端的服务能力，导致服务不可用。DoS攻击就是根据此原理， 耗尽被攻击对象的资源，让目标系统无法响应甚至崩溃。解决方案：服务端对客户端限流，保护服务端的资源。 限流通常在网关或网络层面实施。对各类请求设置最高的QPS阈值，当请求高于阈值时直接阻断。

常用的限流算法有滑动计数，漏斗限流和令牌限流三种：

1. 滑动计数限流：按时间片（比如1秒）定义滑动窗口，计数器记录当前窗口的请求次数， 达到阈值就限流，窗口滑动后计数器归零。可采用循环队列数据结构实现。
2. 漏斗限流：维护一个队列，所有请求进队列，按FIFO服务，队满溢出则丢弃请求。
3. 令牌桶限流：按固定速率往桶中存入令牌，服务前先从桶中取令牌，取到令牌才服务。

## 2 使用

### 2.1 安装

```
go get golang.org/x/time/rate
```

### 2.2 构造一个限流器

```go
// NewLimiter returns a new Limiter that allows events up to rate r and permits
// bursts of at most b tokens.
func NewLimiter(r Limit, b int) *Limiter {
    return &Limiter{
        limit: r,
        burst: b,
    }
}
```
NewLimiter有两个参数

第一个r Limit 表示每秒可以放入多少个token到桶中，Limit是float64的别名；

第二个b int 表示桶容量大小,即同一时刻能取到的最大token数量；

```go
limiter := NewLimiter(10, 1);
```

示例表示每秒放入10个token，桶容量大小为1

```go
limit := Every(100 * time.Millisecond);
limiter := NewLimiter(limit, 1);
```

Every表示放入token速率时间粒度;

示例表示每100ms放入1个token,即1秒放入10个；

### 2.3 Wait/WaitN

```go
func (lim *Limiter) Wait(ctx context.Context) (err error)
func (lim *Limiter) WaitN(ctx context.Context, n int) (err error)
```
Wait获取Token时如果数组不足(小于N)，将会阻塞一段时间，直至Token满足条件, 如果充足则直接返回

阻塞时间可以通过context参数设置Deadline或Timeout控制

### 2.4 Allow/AllowN

```go
func (lim *Limiter) Allow() bool
func (lim *Limiter) AllowN(now time.Time, n int) bool
```
Allow获取Token充足返回true，同时Token减少，否则返回false，不会阻塞

### 2.5 Reserve/ReserveN

```go
func (lim *Limiter) Reserve() *Reservation
func (lim *Limiter) ReserveN(now time.Time, n int) *Reservation
```
返回Reservation对象，有如下对象方法：

```go
func (r *Reservation) OK() bool // 判断是否获取到token
// Delay is shorthand for DelayFrom(time.Now()).
func (r *Reservation) Delay() time.Duration // 获取延迟等待时间,此时Cancel不起作用
func (r *Reservation) DelayFrom(now time.Time) time.Duration
// Cancel is shorthand for CancelAt(time.Now()).
func (r *Reservation) Cancel() // 取消，将获取的Token重新放入桶中
func (r *Reservation) CancelAt(now time.Time)
```
### 2.6 调整速率和桶大小

```go
func (lim *Limiter) SetLimit(newLimit Limit) //改变放入Token的速率
func (lim *Limiter) SetLimitAt(now time.Time, newLimit Limit)

func (lim *Limiter) SetBurst(newBurst int) // 改变Token桶大小
func (lim *Limiter) SetBurstAt(now time.Time, newBurst int)
```
### 2.7 获取速率和桶大小

```go
func (lim *Limiter) Limit() Limit // 获取速率
func (lim *Limiter) Burst() int //获取桶容量
```
## 3 参考

- [Golang 标准库限流器 time/rate 实现剖析](https://www.cyhone.com/articles/analisys-of-golang-rate/)
- [Golang 标准库限流器 time/rate 使用介绍](https://www.cyhone.com/articles/usage-of-golang-rate/)