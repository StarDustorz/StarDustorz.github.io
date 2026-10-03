---
title: "[Go] sync.WaitGroup"
published: 2021-12-04
tags:
  - Golang
  - Go并发编程
lang: zh
toc: true
abbrlink: golang-sync-waitgroup
draft: false
---
> sync.WaitGroup 通过任务计数器等待一组任务完成；Go 1.25 起的 WaitGroup.Go 还会启动并登记任务。WaitGroup 不负责取消任务或收集错误。

<!--more-->

更新于 2026-10-03。

## 1 用法

WaitGroup 的零值可以直接使用。Add 增加或减少任务计数，Done 等价于 Add(-1)，Wait 阻塞到计数归零。

Go 1.25 及更新版本还提供 WaitGroup.Go(f)，由它启动 goroutine 并登记任务；f 不应 panic。若计数为零，Go 必须先于 Wait 调用；复用 WaitGroup 时，新一批 Go 调用也要等上一批 Wait 返回。下方示例使用 Add/Done/Wait，以兼容 Go 1.16 等较早版本。

~~~go
package main

import (
	"fmt"
	"sync"
)

func main() {
	tasks := []int{1, 2, 3}

	var wg sync.WaitGroup
	wg.Add(len(tasks)) // 正计数先于启动任务和 Wait

	for _, task := range tasks {
		task := task // Go 1.16 中固定本轮循环值
		go func() {
			defer wg.Done()
			fmt.Println(task * 2)
		}()
	}

	wg.Wait()
}
~~~

各 goroutine 的输出顺序不确定。实际处理可替换 fmt.Println；共享状态仍需另用锁、channel 或其他同步方式保护。

## 2 Add 与 Wait 的时序

- 当计数为零时，正数 Add 必须发生在 Wait 之前。最简单的做法是在启动 goroutine 前 Add。
- 当计数已经大于零时，可以继续 Add 正数；但不要让 Wait 已观察到零后再为同一批任务追加工作。
- Add 使计数低于零会 panic。
- 同一个 WaitGroup 可用于下一批任务，但新的 Add 必须等上一批所有 Wait 调用返回后再开始。
- WaitGroup 第一次使用后不能复制。Done 同步先于它所唤醒的 Wait 调用返回。

在 goroutine 中用 defer wg.Done() 可确保函数正常返回或沿 panic 展开时递减计数；它不会恢复 panic、把 panic 转成 error，也不会让 WaitGroup 替任务处理错误。需要错误汇总时，可使用 error channel 或显式的结果结构。

## 3 不要把实现细节当成 API

WaitGroup 的内部状态布局会随 Go 版本变化，字段和位布局不是稳定 API。使用时依赖 Add、Done、Wait 的公开语义，不应依赖具体实现结构或性能数字。

## 参考

- [Go 标准库：sync.WaitGroup](https://pkg.go.dev/sync#WaitGroup)
- [Go 内存模型](https://go.dev/ref/mem)
