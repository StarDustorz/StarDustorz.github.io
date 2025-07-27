---
title: "[Go] Connection Reset by Peer or EOF"
published: 2021-10-26
tags:
  - Golang
  - Go其他
lang: zh
toc: true
abbrlink: golang-connection-reset-by-peer-or-eof
draft: false
---

>Golang http.Client请求程序遇到Connection Reset by peer 或 EOF 问题

<!--more-->

## 1 问题

线上服务经常规律性的出现http.Client请求服务器数据和上报数据时报Connection Reset by peer 和 EOF 错误,在测试环境一直没有出现过；

## 2 原因

原因是线上环境是通过代理转发，存在并发连接数限制，当达到限制时服务器会关闭其中一些连接； 同时客户端请求存在连接复用,如果在收到关闭之前复用了连接就会出现Connection Reset by peer 或者 EOF 错误发生在请求建立后读取时，此时服务器已经关闭连接，客户端还没有检测到关闭前读取数据；

## 3 解决方案

在请求时关闭连接复用，每次都使用新的连接；

```go
req, err := NewRequest("POST", url, body)
req.Close = true
```

或者头部设置连接为关闭状态

```go
req, err := NewRequest("POST", url, body)
req.Header.Add("Connection", "close")
```

使用 Transport 取消 HTTP利用连接 DisableKeepAlives 为true时，当前连接只会使用一次

```go
tr := http.Transport{DisableKeepAlives: true}
client := http.Client{Transport: &tr}
client.Get(url)
```

## 4 参考

- [golang http.client 遇到了 Connection reset by peer 问题](https://www.cnblogs.com/jackluo/p/10452026.html)
- [connection reset by peer问题总结及解决方案](https://blog.csdn.net/weixin_34161032/article/details/86360913)
- [Golang 解决"Connection reset by peer"或"EOF"问题](https://my.oschina.net/shou1156226/blog/808613)