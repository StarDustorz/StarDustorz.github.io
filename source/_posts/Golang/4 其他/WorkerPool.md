---
title: "[Go] Golang WorkerPool"
date: 2021-08-11
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
> Golang实现一个工作池处理并发任务


<!--more-->

```go
package main

import (
    "log"
    "time"
)

// Worker 工作者
type Worker struct {
    dataCh chan interface{} // worker channel
    stopCh chan struct{}    // stop channel
}

// NewWorker 新建一个工作者
func NewWorker(lenght int) *Worker {
    return &Worker{
        dataCh: make(chan interface{}, lenght),
        stopCh: make(chan struct{}),
    }
}

// Run 运行一个工作任务
func (w *Worker) Run() {
    for {
        select {
        case msg := <-w.dataCh:
            w.handler(msg)
        case <-w.stopCh:
            return
        }
    }
}

func (w *Worker) stop() {
    select {
    case <-w.stopCh:
        return
    default:
    }
    close(w.stopCh)
}

func (w *Worker) handler(message interface{}) {
    switch msg := message.(type) {
    case stopEvent: // 停止工作任务
        log.Println("worker exit")
        w.stop()
    default:
        //TODO 处理工作任务
        log.Printf("unkown msg %#v", msg)
    }
}

type stopEvent int

// Dispatcher 工作调度器
type Dispatcher struct {
    maxWorkers   int                   // 最大worker数量
    workerLength int                   // worker缓冲长度
    queue        chan interface{}      // 任务调度队列
    workerPool   chan chan interface{} // worker channel pool
    stopCh       chan struct{}         // stop channel
}

// NewDispatcher 创建一个调度器
func NewDispatcher(maxQueue, maxWorkers, workerLength int) *Dispatcher {
    pool := make(chan chan interface{}, maxWorkers) // 创建最大数量
    return &Dispatcher{
        workerPool:   pool,
        maxWorkers:   maxWorkers,
        workerLength: workerLength,
        stopCh:       make(chan struct{}),
        queue:        make(chan interface{}, maxQueue),
    }
}

func (d *Dispatcher) spawnWorker() {
    worker := NewWorker(d.workerLength)
    go worker.Run()
    d.workerPool <- worker.dataCh
}

// Run 运行调度器
func (d *Dispatcher) Run() {
    for i := 0; i < d.maxWorkers; i++ {
        d.spawnWorker()
    }
    go d.dispatch()
}

func (d *Dispatcher) stop() {
    select {
    case <-d.stopCh:
        return
    default:
    }
    close(d.stopCh)
}

// 任务分派器
func (d *Dispatcher) dispatch() {
    for {
        select {
        case msg := <-d.queue:
            d.handler(msg)
        case <-d.stopCh:
            return
        }
    }
}

func (d *Dispatcher) handler(msg interface{}) {
    switch msg.(type) {
    case stopEvent: // 停止分派任务
        d.stop()
        log.Println("dispatcher closed")
        return
    }
    for workerCh := range d.workerPool {
        if (len(workerCh) + 1) == cap(workerCh) {
            workerCh <- stopEvent(1)
            continue
        }
        workerCh <- msg
        d.workerPool <- workerCh
        break
    }
    if len(d.workerPool) < d.maxWorkers {
        d.spawnWorker()
    }
}

func main() {
    defaultDispatch := NewDispatcher(4, 5, 100)
    defaultDispatch.Run()
    for i := 0; i < 100; i++ {
        select {
        case <-defaultDispatch.stopCh:
            return
        default:
        }
        defaultDispatch.queue <- i
    }
    time.Sleep(5 * time.Second)
    //defaultDispatch.queue <- stopEvent(1)
}```