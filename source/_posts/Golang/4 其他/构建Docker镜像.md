---
title: "[Go] Golang Build Docker Image"
date: 2021-06-05
tags:
  - Golang
categories:
  - 技术
  - Golang
published: false
toc: "true"
comments: "true"
description:
---
> Golang应用通过Dockerfile构建Docker镜像

<!--more-->

## 1 构建镜像
构建一个go应用镜像，当前目录加载项目，编译生成二进制文件

```bash
FROM golang:1.14-alpine
RUN mkdir /app
COPY . /app
WORKDIR /app
RUN go build -o main . 
RUN adduser -S -D -H -h /app appuser
USER appuser
CMD ["/app/main"]
```

## 2 多阶段构建镜像
第一阶段使用golang:alpine镜像编译项目生成二进制文件

第二阶段使用scratch镜像加载二进制文件打包成镜像

golang:alpine是Go专门为容器设计的小型Linux发行版,基于 busybox 和 musl 构建的

scratch镜像是Docker项目预定义的最小的镜像,使用scratch镜像可以节省大量空间,减小镜像大小

 
```shell
FROM golang:alpine AS build

RUN mkdir /app
COPY . /app
WORKDIR /app
RUN CGO_ENABLED=0 GOOS=linux go build -o myapp

FROM scratch as final
RUN adduser -S -D -H -h /app appuser
USER appuser
COPY --from=build /app/myapp .
ENTRYPOINT ["/myapp"]`
```

使用编译时参数来指示 go 编译器将运行时库静态链接到二进制文件本身

最终的 Docker 映像只会包含这一个可执行文件，而无需使用容器操作系统

centurylink/ca-certs 是基于 scratch 镜像构建，并为所有标准证书颁发机构添加了根证书。

```shell
FROM golang:alpine as builder
RUN mkdir /app
ADD . /app/
WORKDIR /app
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags '-extldflags "-static"' -o myapp .

FROM centurylink/ca-certs
COPY --from=builder /app/myapp /app/
WORKDIR /app
CMD ["./myapp"]
```


## 3 一个golang工作环境镜像

```shell
// base image
FROM golang:1.12.1

// maintainer
MAINTAINER Phil Wang <814004090@qq.com>

RUN mkdir /develop
RUN mkdir /develop/bin
RUN mkdir /develop/src

EXPOSE 8080

ENV GOPATH /develop
ENV PATH /develop/bin:/usr/local/bin:$PATH
ENV GO111MODULE on

VOLUME /develop/src

WORKDIR /develop

CMD ["sleep","8640000"]
```

```shell
// 运行一个golang12镜像的容器，并指定工作目录$HOME/data/golang/testmod
docker run --name golang12 -p 8080:8080 -v $HOME/data/golang/testmod:/develop/src -d golang:1.12.1

// 进入golang12环境终端，进入后可以操作(build等)
docker exec -it golang12 /bin/bash
```
## 4 参考
- [alpine](https://hub.docker.com/_/alpine/)
- [scratch](https://hub.docker.com/_/scratch/)
- [用 Docker Multi-Stage 編譯出 Go 語言最小 Image](https://blog.wu-boy.com/2017/04/build-minimal-docker-container-using-multi-stage-for-go-app/)
- [创建最小的Go docker 镜像](https://colobu.com/2018/08/13/create-minimal-docker-image-for-go-applications/)
- [给go项目打最小docker镜像，足足降低99%](https://zhuanlan.zhihu.com/p/532635967)