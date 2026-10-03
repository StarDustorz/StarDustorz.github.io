---
title: "[Go] sync.Mutex"
published: 2021-12-04
tags:
  - Golang
  - Go并发编程
lang: zh
toc: true
abbrlink: golang-sync-mutex
draft: false
---
> sync.Mutex 和 sync.RWMutex 提供互斥访问；标准库公开的是同步语义，不承诺等待者的固定排队顺序。

<!--more-->

更新于 2026-10-03。

## 1 sync.Mutex

Mutex 的零值是未加锁状态。第一次使用后不能复制。每次成功的 Lock 都必须配对一次 Unlock。

~~~go
package main

import "sync"

var mu sync.Mutex
var counter int

func increment() {
	mu.Lock()
	defer mu.Unlock()
	counter++
}

func main() {
	increment()
}
~~~

调用 Lock 时，如果锁已经被占用，当前 goroutine 会阻塞等待；同一 goroutine 再次 Lock 不会触发“重复加锁检测”，而会继续阻塞。对未加锁的 Mutex 调用 Unlock 是运行时致命错误，不能依赖 recover 恢复。Mutex 不记录锁属于哪个 goroutine，因此允许一个 goroutine Lock、另一个 goroutine Unlock，但这样做时仍必须保证每次加解锁严格配对。

在 Go 内存模型中，较早的一次 Unlock 同步先于后续成功的 Lock。这让锁内写入可由随后取得同一把锁的 goroutine 观察到。

## 2 sync.RWMutex

RWMutex 允许多个读者同时持有读锁，或一个写者持有写锁；读写不能同时持有。零值可用，首次使用后不能复制。

~~~go
var rw sync.RWMutex
value := 0

rw.RLock()
_ = value // 只读临界区
rw.RUnlock()

rw.Lock()
value++
rw.Unlock()
~~~

每次 RLock 必须配对 RUnlock；每次写 Lock 必须配对 Unlock。漏配会造成阻塞或运行时错误。不能把读锁升级为写锁，也不能把写锁降级为读锁。不要递归获取读锁：如果已有写者等待，新来的 RLock 会阻塞；递归调用可能因此把持锁的 goroutine 自己卡住。

当写锁正在等待时，新读者会被挡住，使已有读者退出后写者能够取得锁。该规则不等同于一个对所有读写者承诺 FIFO 的公平队列；应用不要依赖具体唤醒顺序。

RWMutex 是否比 Mutex 更快取决于临界区、读写比例和竞争情况。先保证锁范围正确，再用实际负载基准测试决定。

## 3 版本边界

state 位编码、自旋次数、饥饿模式阈值和具体排队顺序属于运行时实现细节，会随 Go 版本调整。标准库 API 不保证这些数值或固定的公平顺序；阅读源码时应注明对应的 Go 版本。

## 参考

- [Go 标准库：sync.Mutex](https://pkg.go.dev/sync#Mutex)
- [Go 标准库：sync.RWMutex](https://pkg.go.dev/sync#RWMutex)
- [Go 内存模型](https://go.dev/ref/mem)
