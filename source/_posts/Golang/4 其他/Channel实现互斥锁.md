---
title: "[Go] Golang Channel实现互斥锁"
date: 2021-08-17
tags:
  - Golang
categories:
  - 技术
  - Golang
published: true
toc: "true"
comments: "true"
description:
---
>使用长度为1的有缓冲channel实现互斥锁

<!--more-->

```go
package main

import (
    "sync"
)

// Lock 锁结构
type Lock struct {
    c chan struct{}
}

// NewLock 生成一个锁
func NewLock() Lock {
    var l Lock
    l.c = make(chan struct{}, 1)
    l.c <- struct{}{} // 放入一把锁用于获取
    return l
}

// TryLock 尝试加锁,成功返回true,失败返回false，不会阻塞等待
func (l Lock) TryLock() bool {
    var lockResult bool
    select {
    case <-l.c:
        lockResult = true
    default:
    }
    return lockResult
}

// 加锁,会阻塞竞争
func (l Lock) Lock() {
    <-l.c
}

// 解锁,重复解锁会阻塞
func (l Lock) Unlock() {
    l.c <- struct{}{}
}

var counter int

func main() {
    l := NewLock()
    var wg sync.WaitGroup
    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            if !l.TryLock() {
                println("lock failed")
                return
            }
            counter++
            println("try lock counter ", counter)
            l.Unlock()
        }()
    }
    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            l.Lock()
            counter++
            println("lock counter ", counter)
            l.Unlock()
        }()
    }
    wg.Wait()
}```