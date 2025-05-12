---
title: "[Go] Golang Quic"
date: 2021-08-17
tags:
  - Golang
  - Packges
categories:
  - 技术
  - Golang
  - Packges
published: true
toc: "true"
comments: "true"
description:
---
>Quick UDP Internet Connection

<!--more-->
## 1 QUIC 概述

QUIC（Quick UDP Internet Connection，快速 UDP 互联网连接协议）是一种以 UDP 为底层传输协议，支持加密、多路复用，工作在用户空间的的低延迟传输协议。

Quic 相比现在广泛应用的 http2+tcp+tls 协议有如下优势：

1. 减少了 TCP 三次握手及 TLS 握手时间。
2. 改进的拥塞控制。
3. 避免队头阻塞的多路复用。
4. 连接迁移。
5. 前向冗余纠错。

## 2 server
```go
package main

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/tls"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"io"
	"math/big"
	"time"

	"github.com/lucas-clemente/quic-go"
)

const saddr = "localhost:9999"

func main() {
	listener, err := quic.ListenAddr(saddr, generateTLSConfig(), nil)
	if err != nil {
		fmt.Println(err)

	}
	for {
		sess, err := listener.Accept(context.Background())
		if err != nil {
			fmt.Println(err)
		} else {
			go dealSession(sess)
		}
	}
}

func dealSession(sess quic.Session) {
	fmt.Printf("LocalAddr %s, RemoteAddr %s\n",
		sess.LocalAddr().String(),
		sess.RemoteAddr().String())
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	stream, err := sess.AcceptStream(ctx)
	if err != nil {
		//panic(err)
		fmt.Println(err)
	} else {
		for {
			_, err = io.Copy(loggingWriter{stream}, stream)
			if err != nil {
				fmt.Println("err ", err)
				break
			}
		}
	}
}

type loggingWriter struct{ io.Writer }

func (w loggingWriter) Write(b []byte) (int, error) {
	fmt.Printf("Server: Got '%s'\n", string(b))
	return w.Writer.Write(b)
}

// Setup a bare-bones TLS config for the server
func generateTLSConfig() *tls.Config {
	key, err := rsa.GenerateKey(rand.Reader, 1024)
	if err != nil {
		panic(err)
	}
	template := x509.Certificate{SerialNumber: big.NewInt(1)}
	certDER, err := x509.CreateCertificate(rand.Reader, &template, &template, &key.PublicKey, key)
	if err != nil {
		panic(err)
	}
	keyPEM := pem.EncodeToMemory(&pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(key)})
	certPEM := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: certDER})

	tlsCert, err := tls.X509KeyPair(certPEM, keyPEM)
	if err != nil {
		panic(err)
	}
	return &tls.Config{
		Certificates: []tls.Certificate{tlsCert},
		NextProtos:   []string{"quic-example"},
	}
}
```
## 3 client
```go
package main

import (
	"context"
	"crypto/tls"
	"fmt"
	"io"
	"time"

	"github.com/lucas-clemente/quic-go"
)

const addr = "localhost:9999"

func main() {
	tlsConf := &tls.Config{
		InsecureSkipVerify: true,
		NextProtos:         []string{"quic-example"},
	}
	session, err := quic.DialAddr(addr, tlsConf, nil)
	if err != nil {
		fmt.Println(err)
		return
	}
	stream, err := session.OpenStreamSync(context.Background())
	if err != nil {
		fmt.Println(err)
		return
	}

	ticker := time.NewTicker(2000 * time.Millisecond)
	for t := range ticker.C {
		message := fmt.Sprintf("Client: Sending '%d'", t.Nanosecond())
		_, err = stream.Write([]byte(message))
		if err != nil {
			fmt.Println(err)
			return
		}
		buf := make([]byte, len(message))
		_, err = io.ReadFull(stream, buf)
		if err != nil {
			fmt.Println(err)
			return
		}
		fmt.Printf("Client: Got '%s'\n", buf)
	}
}
```
## 4 运行

```fallback
> go run quic_server.go
LocalAddr 127.0.0.1:9999, RemoteAddr 127.0.0.1:53893
Server: Got 'Client: Sending '519247000''
Server: Got 'Client: Sending '522181000''
Server: Got 'Client: Sending '519381000''

> go run quic_client.go
Client: Got 'Client: Sending '519247000''
Client: Got 'Client: Sending '522181000''
Client: Got 'Client: Sending '519381000''

```
## 5 参考
- [QUIC协议原理分析](https://zhuanlan.zhihu.com/p/32553477)