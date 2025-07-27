---
title: "[Go] ldflags"
published: 2021-08-09
tags:
  - Golang
  - GoPackges
lang: zh
toc: true
abbrlink: golang-ldflags
draft: false
---

> Golang 在编译时使用ldflags动态设置包中变量的值

<!--more-->

```shell
-X importpath.name=value Set the value of the string variable in importpath named name to value. Note that before Go 1.5 this option took two separate arguments. Now it takes one argument split on the first = sign.
```

ldflags用于链接过程，详细见文章[也谈Go的可移植性](https://tonybai.com/2017/06/27/an-intro-about-go-portability/)
[静态链接,动态链接,静态库,共享库这些概念的详解](http://blog.champbay.com/2019/11/25/%e9%9d%99%e6%80%81%e9%93%be%e6%8e%a5%e5%8a%a8%e6%80%81%e9%93%be%e6%8e%a5%e9%9d%99%e6%80%81%e5%ba%93%e5%85%b1%e4%ba%ab%e5%ba%93%e8%bf%99%e4%ba%9b%e6%a6%82%e5%bf%b5%e7%9a%84%e8%af%a6%e8%a7%a3/)

## 1 参数作用

``golang在编译、测试、安装时使用-ldflags -X动态设置包中变量的值 go install/build/test 时可以通过命令行参数设置package中的变量， 其格式为-X importpath.name=val, 其中importpath是变量所在包的的路径， name是包中定义的变量， val 是需要在编译时设置的变量的值(string)， name表示的变量只能是variable，不能是constant, 且不能通过函数调用的方式初始化， 其类型只能是string，不可是int, bool等. 如果val中存在空格,需要用引号括起来,如下date和go version输出结果有空格： go build -ldflags "-X 'main.BUILD_TIME=`date`' -X 'main.GO_VERSION=`go version`'"``

```shell
> docker version 
> Client: Docker Engine - Community 
> 	Version: 19.03.3 
> 	API version: 1.40 
> 	Go version: go1.12.10 
> 	Git commit: a872fc2 
> 	Built: Tue Oct 8 00:55:12 2019 
> 	OS/Arch: darwin/amd64 
> 	Experimental: false
```

## 2 编译时使用

```go
package main

import "fmt"

var (
	version    string
	build_time string
	go_version string
	git_commit string
)

func main() {
	fmt.Println("version:", version)
	fmt.Println("go version:", go_version)
	fmt.Println("build time:", build_time)
	fmt.Println("git log:", git_commit)
}```

执行输出：

```shell
> go build -ldflags "-X 'main.build_time=$(date)' -X 'main.git_commit=$(git log --pretty=format:"%h" -1)' -X main.version=1.0.0 -X 'main.go_version=`go version`'" main.go
> ./main
version: 1.0.0
go version: go version go1.14 darwin/amd64
build time: 2021年 8月 9日 星期日 19时09分50秒 CST
git log: 175a5eb```

## 测试时使用

创建包和文件

```shell
> mkdir $GOPATH/src/gotest 
> touch $GOPATH/src/gotest/go_test.go
```

```go
package gotest

import "testing"

var time string
var version string

func TestBuild(t *testing.T) {
  t.Log(time)
  t.Log(version)
}```


执行输出：

```shell
> cd $GOPATH/src/
> GO111MODULE=off go test -ldflags="-X 'gotest.time=`date`' -X gotest.version=1.0.1" gotest -v
=== RUN   TestBuild
    TestBuild: go_test.go:9: 2021年 8月 9日 星期日 18时57分49秒 CST
    TestBuild: go_test.go:10: 1.0.1
--- PASS: TestBuild (0.00s)
PASS
ok      gotest  0.009s```


## 参考

- [ldflags使用技巧](https://www.cnblogs.com/ahmczsy/p/11512151.html)
- [也谈Go的可移植性](https://tonybai.com/2017/06/27/an-intro-about-go-portability/)
- [静态链接,动态链接,静态库,共享库这些概念的详解](http://blog.champbay.com/2019/11/25/%e9%9d%99%e6%80%81%e9%93%be%e6%8e%a5%e5%8a%a8%e6%80%81%e9%93%be%e6%8e%a5%e9%9d%99%e6%80%81%e5%ba%93%e5%85%b1%e4%ba%ab%e5%ba%93%e8%bf%99%e4%ba%9b%e6%a6%82%e5%bf%b5%e7%9a%84%e8%af%a6%e8%a7%a3/)
- [Linux C编程一站式学习](https://book.douban.com/subject/4141733/)
- [Linux C编程一站式学习 ebook](http://docs.linuxtone.org/ebooks/C&CPP/c/)