---
title: "[Go] Context"
published: 2022-07-10
tags:
  - Golang
  - Go并发编程
lang: zh
toc: true
abbrlink: golang-context
draft: false
---
> context.Context 传递取消信号、截止时间和请求范围内的值；收到取消信号的 goroutine 必须自己检查并退出。

<!--more-->

更新于 2026-10-03。

## 1 Context 提供什么

Context 接口可在 API 边界和 goroutine 之间传递请求范围的信息：

~~~go
type Context interface {
	Deadline() (deadline time.Time, ok bool)
	Done() <-chan struct{}
	Err() error
	Value(key interface{}) interface{}
}
~~~

- Deadline 返回最早适用的截止时间；ok 为 false 表示没有截止时间。
- Done 返回取消信号 channel。超时、显式调用取消函数或父 context 被取消时，该 channel 会关闭；永不取消的 context 可以返回 nil。
- Err 在 Done 尚未关闭时返回 nil；取消后返回 context.Canceled，因截止时间结束则返回 context.DeadlineExceeded。
- Value 用于请求范围的数据，不应用来传可选参数或充当通用数据存储。

同一个 Context 可以安全地在多个 goroutine 中并发使用。Context 本身只提供信号和信息，不会强制终止 goroutine，不会中断任意同步函数，也不会自动关闭业务 channel。每个长期运行的任务都要在适当位置检查 Done，并自行返回；调用的 I/O 或阻塞操作也应支持 context，或在 select 中等待取消信号。

## 2 创建、传递与释放

Background 通常用作请求树的根；TODO 表示调用方暂时还无法确定应传哪个 Context。派生 context 的取消会向下传播，不会向上取消父 context。

~~~go
ctx, cancel := context.WithTimeout(parent, 2*time.Second)
defer cancel() // 操作提前完成时也释放相关资源
~~~

把 context 作为需要它的函数的第一个参数传入，不要存进结构体字段，也不要传 nil。WithCancel、WithDeadline、WithTimeout 返回的取消函数应在所有控制路径上调用，常用 defer cancel()。

WithValue 的 key 必须非 nil 且可比较。定义包私有的专用 key 类型，避免不同包用同一基础类型的字符串键发生冲突；Value 只承载少量请求范围元数据。

## 3 让 worker 响应取消

取消只是发出协作式通知。下面的 worker 在每轮 select 中观察取消信号，并返回；主 goroutine 另行等待它结束。若任务正在执行一段不检查 context 的长时间计算，它会继续运行到代码主动检查为止。

~~~go
package main

import (
	"context"
	"time"
)

func worker(ctx context.Context, ticks <-chan time.Time, finished chan<- struct{}) {
	defer close(finished)
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticks:
			// 执行一小段工作，然后回到 select 检查取消信号
		}
	}
}

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()

	finished := make(chan struct{})
	go worker(ctx, ticker.C, finished)

	cancel()    // 只发出信号，不等待 worker 退出
	<-finished // 显式等待 worker 完成清理
}
~~~

若某个任务阻塞在不支持 context 的函数中，仅关闭 Done 不会把它唤醒。应选择 context-aware 的库 API，或设计能被 select 取消的 I/O/队列等待方式。

## 4 HTTP 请求超时

用 NewRequestWithContext 把 context 交给 HTTP 客户端。响应体必须关闭；客户端请求超时后，仍应处理并记录实际返回的错误。

~~~go
package main

import (
	"context"
	"io"
	"net/http"
	"time"
)

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://example.com/", nil)
	if err != nil {
		panic(err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	if _, err := io.Copy(io.Discard, resp.Body); err != nil {
		panic(err)
	}
}
~~~

## 5 版本边界

cancelCtx、timerCtx、valueCtx 等类型未导出，不属于稳定 API；其字段与内部实现会随 Go 版本变化。Go 1.16 代码使用 interface{} 表示任意值，any 作为别名从 Go 1.18 起提供。

## 参考

- [Go 标准库：context](https://pkg.go.dev/context)
- [Go 博客：Go Concurrency Patterns: Context](https://go.dev/blog/context)
