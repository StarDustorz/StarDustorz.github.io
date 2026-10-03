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
> Connection reset 和 EOF 是请求链路中的症状；仅凭错误文本不能断定根因就是代理连接数限制或连接复用。

<!--more-->

更新于 2026-10-03。

## 1 先区分观测与推断

Connection reset by peer 和 EOF 是请求链路中的错误表现。代理并发限制或复用到已关闭的空闲连接都可能是原因；错误文本本身不能证明根因。

连接复用可能让客户端再次遇到已被服务端或代理关闭的空闲连接；但连接重置也可能来自服务端、代理、防火墙或网络路径。EOF 可能是正常读到响应体结束，也可能是响应被截断时暴露出的错误。先记录错误发生在建连、写请求、读取响应头还是读取响应体，并结合服务端/代理日志、连接空闲时间和复用情况排查。

## 2 用可复用的客户端并检查响应体

默认 Transport 会复用连接。通常应复用 Client 和 Transport，关闭响应体，并先调整代理/服务端的超时和连接上限。下面示例保留连接复用并为请求设置超时：

~~~go
package main

import (
	"context"
	"io"
	"net/http"
	"time"
)

func get(url string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	_, err = io.Copy(io.Discard, resp.Body)
	return err
}

func main() {
	_ = get("https://example.com/")
}
~~~

## 3 将关闭连接作为诊断手段

要验证问题是否与 HTTP/1.x 空闲连接复用有关，可临时对单个请求设置：

~~~go
req.Close = true
~~~

这会阻止该请求完成后复用 TCP 连接。也可以在独立 Transport 上设置：

~~~go
transport := &http.Transport{
	DisableKeepAlives: true,
}
client := &http.Client{Transport: transport}
~~~

如果这样改变了现象，说明连接复用路径值得继续排查，但不能据此证明代理连接数就是根因。关闭 keep-alive 会增加建连成本，也可能增加代理和服务端负担，不宜未经测量就作为默认修复。Request.Close 或 Transport.DisableKeepAlives 才是标准库支持的控制方式；不要只依赖手动添加 Connection 请求头。

## 4 重试边界

不要对所有 EOF 或 reset 盲目重试。非幂等请求重试可能重复写入或扣款。标准库 Transport 仅在特定条件下自动重试：连接此前成功使用过、请求幂等，并且请求体为空或提供了可重新读取的 GetBody。应用层重试还应由业务判断幂等性、限制次数并加入退避；无法安全重放的请求不要自动重试。

## 参考

- [Go 标准库：net/http.Request](https://pkg.go.dev/net/http#Request)
- [Go 标准库：net/http.Transport](https://pkg.go.dev/net/http#Transport)
- [Go 标准库：net/http.Client](https://pkg.go.dev/net/http#Client)
- [Go 标准库：io.EOF](https://pkg.go.dev/io#EOF)
