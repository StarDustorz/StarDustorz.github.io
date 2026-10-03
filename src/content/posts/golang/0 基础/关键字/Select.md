---
title: "[Go] Select"
published: 2021-08-19
tags:
  - Golang
  - Go关键字
lang: zh
toc: true
abbrlink: golang-select
draft: false
---
> select 在多个 channel 收发操作之间等待，并执行一个当前可进行的操作。

更新于 2026-10-03。

<!--more-->

## 1 基本行为

select 包含若干通信分支，每个 case 必须是一次 channel 发送或接收；还可以有一个 default。

- 进入 select 时，各 case 的 channel 表达式，以及发送 case 的右侧表达式，按源码顺序各求值一次。
- 如果一个或多个通信操作可以进行，Go 从中均匀伪随机地选择一个执行。源码顺序不代表优先级，也没有固定轮转或严格公平保证。
- 如果没有通信操作可以进行且存在 default，就立即执行 default；没有 default 则阻塞，直到某个操作可以进行。
- nil channel 上的收发永远不能进行，因此对应 case 会被禁用；若只剩 nil channel 且没有 default，select 会永久阻塞。
- 从已关闭的 channel 接收是就绪操作：若仍有缓冲数据，会先逐个返回缓存值且 ok 为 true；缓存排空后才返回零值且 ok 为 false。向已关闭的 channel 发送会 panic。

## 2 常见写法

### 等待任务或取消信号

~~~go
package main

import (
	"context"
	"fmt"
)

func consume(ctx context.Context, jobs <-chan int) {
	for {
		select {
		case job, ok := <-jobs:
			if !ok {
				return // jobs 已关闭
			}
			fmt.Println(job)
		case <-ctx.Done():
			return
		}
	}
}

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	jobs := make(chan int, 1)
	jobs <- 7
	close(jobs)
	consume(ctx, jobs)
}
~~~

若 jobs 已关闭，同时 ctx.Done() 也已关闭，两个 case 都可能就绪；select 不保证哪个先被选中。若业务要求优先处理某个条件，应显式编写后续判断，而不要依赖 case 的排列顺序。

### 非阻塞尝试

~~~go
select {
case value := <-ch:
	_ = value
default:
	// 现在没有可接收的数据，继续做别的事
}
~~~

default 常用于一次性的非阻塞尝试。若把它放进循环并在 default 中立即继续，循环会忙等并持续占用 CPU；等待事件通常应省略 default，或使用定时器控制轮询间隔。

## 3 记住这几点

select 不是优先级队列，也不会自动取消或关闭 channel。关闭 channel 是发送方的职责；接收方可用 ok 判断是否已关闭。select 中的发送值会在选择分支前求值，即使最终没有选中该分支，其求值副作用也已经发生。

## 参考

- [Go 语言规范：Select statements](https://go.dev/ref/spec#Select_statements)
- [Go 标准库：context](https://pkg.go.dev/context)
