---
title: RPC
date: 2021-06-12 19:29:17
tags:
  - RPC
categories:
  - Basic
published: false
toc: "true"
comments: "true"
description: 
---
	
	RPC（Remote Procedure Call）远程过程调用，是一种通过网络从远程计算机程序上请求服务，而不需要了解底层网络技术的协议
## 1 RPC机制和实现过程
- RPC 是远程过程调用的方式之一，涉及调用方和被调用方两个进程的交互。因为 RPC 提供类似于本地方法调用的形式，所以对于调用方来说，调用 RPC 方法和调用本地方法并没有明显区别。
　　1. 定义 IDL 文件，生成 stub 桩文件，实现函数映射
　　2. 调用者（客户端Client）以本地调用的方式发起调用； 
　　3. 序列化：Client stub（客户端存根）收到调用后，负责将被调用的方法名、参数等打包编码成特定格式的能进行网络传输的消息体； 
　　4. Client stub将消息体通过网络发送给服务端；  
　　5. Server stub（服务端存根）收到通过网络接收到消息后按照相应格式进行拆包解码，获取方法名和参数；  
　　6. Server stub根据方法名和参数进行本地调用；  
　　7. 被调用者（Server）本地调用执行后将结果返回给server stub；  
　　8. Server stub将返回值打包编码成消息，并通过网络发送给客户端；  
　　9. Client stub收到消息后，进行拆包解码，返回给Client；  
　　10. Client得到本次RPC调用的最终结果。
- **消息协议**：以何种方式打包编码和拆包解码，有基于纯文本的 XML 和 JSON、二进制编码的Protobuf和Hessian等，或者自定义私有协议
- **传输控制**：主要有HTTP传输和TCP传输，鉴于TCP传输的可靠性，RPC的传输一般使用TCP作为传输协议
- **RPC和HTTP区别**  
	- RPC 和 HTTP都是微服务间通信较为常用的方案之一，其实RPC 和 HTTP 并不完全是同一个层次的概念，它们之间还是有所区别的。  
		- RPC 是远程过程调用，其调用协议通常包括序列化协议和传输协议。序列化协议有基于纯文本的 XML 和 JSON、二进制编码的Protobuf和Hessian。传输协议是指其底层网络传输所使用的协议，比如 TCP、HTTP。  
		- 可以看出HTTP是RPC的传输协议的一个可选方案，比如说 gRPC 的网络传输协议就是 HTTP。HTTP 既可以和 RPC 一样作为服务间通信的解决方案，也可以作为 RPC 中通信层的传输协议（此时与之对比的是 TCP 协议）。