---
title: "[Go] Channel实现互斥锁"
published: 2021-08-17
tags:
  - Golang
  - Go其他
lang: zh
toc: true
abbrlink: golang-mutex-by-channel
draft: false
---
> 有缓冲 channel 可以实现一个简单的互斥锁，但它的零值、误用诊断和公平性都与 sync.Mutex 不同。

<!--more-->

更新于 2026-10-03。

## 1 实现

下面用容量为 1 的 channel 表示锁定状态：成功向 channel 发送表示取得锁，接收表示释放锁。必须通过构造函数创建。

~~~go
package main

import (
	"fmt"
	"sync"
)

type ChannelMutex struct {
	token chan struct{}
}

func NewChannelMutex() *ChannelMutex {
	return &ChannelMutex{token: make(chan struct{}, 1)}
}

func (m *ChannelMutex) Lock() {
	m.token <- struct{}{}
}

func (m *ChannelMutex) TryLock() bool {
	select {
	case m.token <- struct{}{}:
		return true
	default:
		return false
	}
}

func (m *ChannelMutex) Unlock() {
	<-m.token
}

func main() {
	m := NewChannelMutex()
	var wg sync.WaitGroup
	counter := 0

	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			m.Lock()
			counter++
			m.Unlock()
		}()
	}
	wg.Wait()
	fmt.Println(counter)
}
~~~

## 2 使用边界

- 零值中的 token 是 nil channel，调用 Lock 或 Unlock 会阻塞；必须调用 NewChannelMutex。
- Unlock 必须与一次成功的 Lock 或 TryLock 配对。未配对的 Unlock 会阻塞；该类型不记录 goroutine 所有权，也不会像 sync.Mutex 那样对解锁未加锁状态给出运行时错误。
- TryLock 只尝试一次，失败时立即返回 false。失败不表示取得了锁，也不能替代对共享状态的同步。
- 不要依赖 channel 等待者的具体调度顺序。此实现没有提供对所有调用场景的公平性承诺。
- 日常互斥优先使用 sync.Mutex。channel 锁只适合确实需要用 channel 表达许可令牌、且团队能维护其限制的场景。

## 参考

- [Go 语言规范：Channel types](https://go.dev/ref/spec#Channel_types)
- [Go 标准库：sync.Mutex](https://pkg.go.dev/sync#Mutex)
