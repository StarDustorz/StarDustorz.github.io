---
title: "[Go] Golang Test 工具指令"
date: 2021-10-26
tags:
  - Golang
  - Go-Package
categories:
  - 技术
  - Golang
  - Packages
published: true
toc: "true"
comments: "true"
description:
---
>Golang Test 工具指令

<!--more-->

## 1 简介
Go test 测试工具包含示例函数测试 (ExampleXXX)、单元测试 (TestXXX)、基准测试 (BenchmarkXXX)。

命令格式：
```shell
Go test [-c] [-i] [build flags] [packages] [flags for test binary]
```
参数解释：

```
-c : 编译 go test 成为可执行的二进制文件，但是不运行测试。
-i : 安装测试包依赖的 package，但是不运行测试。

build flags 是编译过程中常用参数，使用命令 `go help build` 查看帮助

packages 是关于包管理参数，使用命令 `go help packages` 查看帮助

flags for test binary 是 test 常用参数，使用命令 `go help testflag` 查看帮助, 部分参数如下：
-test. V : 是否输出全部的单元测试用例（不管成功或者失败），默认没有加上，所以只输出失败的单元测试用例。
-test. Run pattern: 指定正则来运行某个/某些测试用例
-test. Bench patten: 只跑那些性能测试用例
-test. Benchmem : 是否在性能测试的时候输出内存情况
-test. Benchtime t : 性能测试运行的时间，默认是 1 s
-test. Cpuprofile cpu. Out : 是否输出 cpu 性能分析文件，为空则不做 cpu 分析
-test. Memprofile mem. Out : 是否输出内存性能分析文件
-test. Blockprofile block. Out : 是否输出内部 goroutine 阻塞的性能分析文件
-test. Memprofilerate n : 内存分析参数，内存分析的抽样率, 默认 512*1024, 可结合 GOGC=off 来关闭内存回收，对每个内存块的分配进行观察。
-test. Blockprofilerate n: 阻塞事件的分析参数，指定抽样频率，控制 goroutine 阻塞时候打点的纳秒数。默认 1。
-test. Parallel n : 性能测试的程序并行 cpu 数，默认等于 GOMAXPROCS。
-test. Timeout t : 如果测试用例运行时间超过 t，则抛出 panic
-test. Cpu 1,2,4 : 程序运行在哪些 CPU 上面
-test. Short : 将那些运行时间较长的测试用例运行时间缩短
-test. Outputdir : 输出目录
-test. Coverprofile : 测试覆盖率参数，指定输出文件
```

测试函数示例：

```go
// test 测试函数
Func TestXXX (t *testing. T) { … }
// benchmark 基准函数
Func BenchmarkXXX (b *testing. B) { … }
// examples 示例函数
Func ExamplePrintln () {
    Println (“output”)
}
```
执行测试函数：

```go
Go test -v -run='TestXXX'

Go test -v xxx_test. Go -run='TestXXX'

Go test -v xxx_test. Go -test. Run TestXXX

Go test -v xxx_test. Go -bench=.

Go test -v xxx_test. Go -bench=XXX

Go test -v xxx_test. Go -bench=BenchmarkXXX

Go test -v xxx_test. Go -bench=^BenchmarkXXX$ -run=^$
```
-v 参数表示是否通过测试都会显示结果，不加-v 表示只显示未通过的测试

其他参数：-p -cpu=1,2,4 -args= -parallel -timeout -run -short

执行基准测试:

```go
Go test -bench=.
Go test -c
./xxx. Test -test. Bench=.
Go test -bench=. -benchtime 0.1 s
./xxx. Test -test. Bench=. -test. Benchtime=1 s
Go test -bench=. -count=2
./xxx. Test -test. Bench=. -test. Count=2
# -benchmem : 打印用于基准测试的内存分配统计数据
Go test -bench=. -benchmem
./xxx. Test -test. Bench -test. Benchmem
```
## 2 参考：
- [Go 测试，go test 工具的具体指令 flag](https://deepzz.com/post/the-command-flag-of-go-test.html)
- [Golang 测试](https://sanyuesha.com/2019/08/21/go-test/)
- [golang test测试使用](https://studygolang.com/articles/2491)
- [标准库testing](http://doc.golang.ltd/)