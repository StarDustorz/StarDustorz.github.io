---
title: "[Go] WorkerPool"
published: 2021-08-11
tags:
  - Golang
  - Go其他
lang: zh
toc: true
abbrlink: golang-workerpool
draft: false
---
> 固定数量的 worker 从有界任务队列取任务；队列满时 Submit 会阻塞形成背压，Close 会关闭队列并等待已接收任务完成。

<!--more-->

更新于 2026-10-03。

## 1 一个可关闭的固定 worker pool

下面的实现把生命周期限定为：创建固定数量的 worker、提交函数任务、关闭并排空队列。它不会自动扩容，也不会替任务捕获 panic。

~~~go
package main

import (
	"errors"
	"fmt"
	"sync"
)

var ErrPoolClosed = errors.New("worker pool is closed")

type WorkerPool struct {
	tasks chan func()
	wg    sync.WaitGroup

	mu     sync.RWMutex
	closed bool
}

func NewWorkerPool(workers, queueCapacity int) (*WorkerPool, error) {
	if workers <= 0 {
		return nil, errors.New("workers must be greater than zero")
	}
	if queueCapacity < 0 {
		return nil, errors.New("queue capacity must not be negative")
	}

	p := &WorkerPool{tasks: make(chan func(), queueCapacity)}
	p.wg.Add(workers)
	for i := 0; i < workers; i++ {
		go p.worker()
	}
	return p, nil
}

func (p *WorkerPool) worker() {
	defer p.wg.Done()
	for task := range p.tasks {
		task()
	}
}

// Submit 在队列满时等待空间；pool 关闭后返回 ErrPoolClosed。
func (p *WorkerPool) Submit(task func()) error {
	if task == nil {
		return errors.New("task must not be nil")
	}

	p.mu.RLock()
	defer p.mu.RUnlock()
	if p.closed {
		return ErrPoolClosed
	}
	p.tasks <- task
	return nil
}

// Close 不再接受新任务，排空已接收任务后返回。应由 pool 外部调用。
func (p *WorkerPool) Close() {
	p.mu.Lock()
	if !p.closed {
		p.closed = true
		close(p.tasks)
	}
	p.mu.Unlock()

	p.wg.Wait()
}

func main() {
	pool, err := NewWorkerPool(4, 8)
	if err != nil {
		panic(err)
	}

	var mu sync.Mutex
	completed := 0
	for i := 0; i < 20; i++ {
		if err := pool.Submit(func() {
			mu.Lock()
			completed++
			mu.Unlock()
		}); err != nil {
			pool.Close()
			panic(err)
		}
	}
	pool.Close()
	fmt.Println(completed)
}
~~~

## 2 生命周期与背压

- 每个任务由固定 worker 中的一个执行；任务执行时间和顺序不由 pool 保证。
- 缓冲队列达到容量后，Submit 会阻塞，直到有 worker 取走任务。这是背压；如调用方不能阻塞，应在 pool 外设计明确的拒绝或超时策略。
- Submit 与 Close 并发时，内部读写锁保证不会向已关闭的 channel 发送。Close 等待正在进行的 Submit 完成，再关闭队列。
- Close 会等队列中已接收的任务执行完；任务若永久阻塞，Close 也会等待。不要从 pool 自己的任务中调用 Close，否则会等待包含调用者在内的 worker。
- 不要在 pool 的任务中同步递归 Submit 到同一个 pool。队列已满且所有 worker 都阻塞在 Submit 时，没有 worker 能继续取任务，系统会死锁。
- 此实现没有取消任务或错误收集机制。task panic 不会被转成 error；需要隔离 panic 时必须定义并测试明确的恢复策略。

## 参考

- [Go 标准库：sync.WaitGroup](https://pkg.go.dev/sync#WaitGroup)
- [Go 标准库：channel 语义](https://go.dev/ref/spec#Channel_types)
