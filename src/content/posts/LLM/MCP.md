---
title: "[LLM] MCP：模型上下文协议的架构、能力与工程价值"
published: 2026-04-27
updated: 2026-04-27
description: 围绕问题背景、角色划分、核心能力与协议机制，梳理 MCP 的设计目标及其与 Function Calling 的关系。
tags:
  - LLM
draft: false
toc: true
lang: zh
abbrlink: llm-what-is-mcp
---

## 引言

随着大模型应用逐步具备读写文件、访问数据库、调用 API 和执行外部操作的能力，工具接入已经成为 Agent 系统的重要组成部分。问题不在于模型能否调用工具，而在于这些工具如何被稳定地组织、描述、发现和复用。

如果每个应用都以私有方式维护工具定义、参数格式、鉴权逻辑和调用适配层，那么工具一旦增多，系统很快会出现重复建设、接口分裂和迁移成本过高的问题。`MCP`（Model Context Protocol，模型上下文协议）正是在这样的背景下提出的。

本文从工程实现的角度，对 MCP 的设计目标、角色结构、能力边界、通信机制以及它与 Function Calling 的关系做一次系统梳理。

![MCP 工作机制总览](https://obsidian-1309391399.cos.ap-shanghai.myqcloud.com/Image/mcp-overview-1.png)

## 什么是 MCP

MCP 全称是 `Model Context Protocol`，可以直译为“模型上下文协议”。

从官方定义看，MCP 是一套用于 **AI 应用与外部能力之间交换上下文的开放协议**。这里的“外部能力”既包括工具调用，也包括只读资源和可复用提示模板。它主要关注以下问题：

- AI 应用如何连接外部系统
- 外部系统如何把自己的能力标准化暴露出来
- 客户端如何发现、读取和调用这些能力

需要强调的是：**MCP 只定义上下文交换协议本身，并不规定宿主应用如何使用大模型，也不规定具体的提示词策略。**

因此，MCP 更接近一种面向 AI 工具生态的接口标准，而不是某个具体框架或单一厂商能力。

## 为什么 MCP 会变得重要

在 MCP 出现之前，AI 应用接入工具通常采用项目内手工集成的方式：

- 给模型定义一份工具 Schema
- 手写调用逻辑
- 手写认证、错误处理和返回格式转换
- 换一个应用或者换一个模型，再重新适配一遍

这种方式在工具数量有限时尚可维护，但进入 Agent 场景后，问题会迅速放大：

- 工具数量越来越多，维护成本飙升
- 同一个工具在多个项目里重复实现
- 不同客户端之间难以复用
- 工具描述、参数格式、授权方式缺乏统一标准

MCP 的核心价值，在于把原本散落在各个应用内部的接入逻辑，提升为一套可复用、可协商的标准协议。工具提供方只需按协议实现 MCP Server，支持 MCP 的客户端即可发现并接入这些能力，而不必为每个宿主系统重复编写一套对接代码。

## 从三个层次理解 MCP

理解 MCP，比较合适的方式是把它拆成三个层次来看：

1. 角色层：谁和谁通信
2. 能力层：Server 能暴露什么
3. 协议层：消息怎么传

### 1. 角色层：Host、Client、Server

MCP 采用标准的 Client-Server 架构，但在实际语义上并不只是“客户端 + 服务端”的二元划分，而是包含三个角色：

| 角色 | 含义 | 典型例子 |
| --- | --- | --- |
| Host | 宿主 AI 应用，负责统一管理 MCP 连接 | Claude Desktop、Cursor、VS Code、各类 Agent 应用 |
| Client | Host 内部负责与某个 Server 通信的模块 | 宿主应用为每个 Server 建立的 MCP 连接 |
| Server | 独立提供能力的程序 | 文件系统 Server、GitHub Server、数据库 Server |

其中最容易混淆的是 Host 和 Client：

- `Host` 是你正在使用的 AI 应用本身
- `Client` 是 Host 内部的一个连接实例，负责和某个 MCP Server 建立专属连接

由此可以得到几个直接结论：

- 一个 Host 可以同时连接多个 Server
- 通常一个 Server 对应一个独立 Client 连接
- 本地 Server 常通过 `stdio` 接入
- 远程 Server 常通过 `Streamable HTTP` 接入

例如，一个 AI 编码助手可以同时连接：

- 文件系统 MCP Server
- GitHub MCP Server
- PostgreSQL MCP Server
- 浏览器自动化 MCP Server

这样，宿主应用就可以在同一个会话中整合文件系统、代码仓库、数据库和浏览器等多类外部能力。

### 2. 能力层：Tools、Resources、Prompts

MCP Server 暴露的并不只是工具调用，还包括三类核心能力：

| 能力 | 本质 | 是否有副作用 | 谁主导使用 |
| --- | --- | --- | --- |
| Tools | 可执行操作 | 通常有 | 模型 |
| Resources | 只读数据 | 没有 | 应用 |
| Prompts | 可复用提示模板 | 没有直接副作用 | 用户 |

#### Tools：让模型执行动作

Tools 是最常被提到的一类能力，对应的是可执行操作。

典型场景包括：

- 创建或修改文件
- 调用第三方 API
- 查询数据库
- 发送消息
- 创建日历事件

Tools 的关键特征在于：**执行后可能改变外部系统的状态**。因此在许多实现中，Tools 往往伴随显式授权、审批或权限控制机制。

#### Resources：给模型提供上下文

Resources 是只读资源，用来向模型提供上下文信息。

例如：

- 某个文件的内容
- 数据库表结构
- API 文档
- 某条业务记录
- 某个目录下的日志

它与 Tools 的根本差别不在形式，而在于**是否具有副作用**。Resources 只负责提供信息，不负责执行动作。

#### Prompts：把最佳实践模板化

Prompts 是预定义的提示模板，通常带有参数。

它适合用来沉淀团队经验，例如：

- 代码审查模板
- 缺陷分析模板
- 需求拆解模板
- SQL 优化模板

相较于临时编写提示词，Prompts 的价值主要体现在：

- 结构统一
- 参数明确
- 可以沉淀最佳实践
- 适合多人协作和重复使用

从职责划分看：

- Tools 负责行动
- Resources 负责提供事实
- Prompts 负责提供方法

## MCP 的协议机制是怎么跑起来的

### 数据层：统一使用 JSON-RPC 2.0

MCP 的数据层基于 `JSON-RPC 2.0`。这意味着 Client 和 Server 之间交换的是统一结构的 JSON 消息，请求、响应和通知都遵循一致的格式。

一个典型的交互过程通常包括：

1. Client 发起 `initialize`
2. 双方协商协议版本和能力
3. Client 通过 `tools/list`、`resources/list`、`prompts/list` 发现能力
4. 后续按需读取资源或调用工具

一个简化后的调用过程大致如下：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}
```

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "get_forecast",
    "arguments": {
      "city": "Shanghai"
    }
  }
}
```

从工程视角看，MCP 数据层主要解决两件事：

- 消息结构统一
- 能力发现和调用方式统一

### 生命周期：先初始化，再协商能力

MCP 不是建立连接后立即调用工具，而是一个带有生命周期管理的状态化协议。

建立连接后，客户端通常会先执行初始化握手，用来完成：

- 协议版本协商
- 双方能力声明
- 身份信息交换

初始化完成后，客户端才知道：

- 这个 Server 是否支持 Tools
- 是否支持 Resources
- 是否支持 Prompts
- 是否支持变更通知

这一步的意义在于，MCP 不只是定义“如何调用”，也定义“如何协商能力”和“如何维持协议演进”。

### 传输层：本地常用 stdio，远程推荐 Streamable HTTP

MCP 的传输层与数据层是解耦的。无论底层采用哪种传输方式，上层都可以继续使用同一套 JSON-RPC 消息格式。

当前官方文档中，主要支持两种传输方式：

| 传输方式 | 适用场景 | 特点 |
| --- | --- | --- |
| `stdio` | 本地进程通信 | 启动简单、延迟低、无网络开销 |
| `Streamable HTTP` | 远程服务通信 | 适合多客户端共享、支持标准 HTTP 鉴权 |

这里需要注意一个版本演进问题：

- 早期资料里经常会提到 `HTTP + SSE`
- 现在官方更推荐的是 `Streamable HTTP`
- `Server-Sent Events` 仍然可以作为流式返回机制存在，但不再建议继续使用早期那种“双端点心智模型”去理解最新协议

阅读旧资料时，最好显式区分协议版本，避免把早期方案直接等同于当前推荐实现。

![MCP 初始化与工具调用流程](https://obsidian-1309391399.cos.ap-shanghai.myqcloud.com/Image/mcp-sequence-1.png)

## MCP 和 Function Calling 到底是什么关系

这是理解 MCP 时最常见的混淆点。

**Function Calling 和 MCP 不是替代关系，而是不同层次上的协作关系。**

### Function Calling 解决什么问题

Function Calling 主要解决的是以下问题：

- 模型如何表达“我要调用哪个函数”
- 参数应该长什么样
- 工具返回结果后，如何继续对话

它的关注点是**单次工具调用的表达格式**。

### MCP 解决什么问题

MCP 解决的则是另一层问题：

- 工具如何标准化暴露
- 客户端如何自动发现工具
- 同一个工具如何跨项目、跨宿主复用
- 资源、提示模板和工具如何纳入同一套协议

它关注的是**工具生态的组织、发现、复用与互操作**。

### 两者最准确的关系

可以把两者概括为：

- `Function Calling` 像是“模型发起一次调用时使用的语言格式”
- `MCP` 像是“工具世界的统一接入协议”

在很多实际实现中，宿主应用会把 MCP Server 暴露出来的 Tools，转换成模型原生支持的工具调用格式，再交给模型决定是否调用。

这意味着：

- 模型看到的是“可调用工具列表”
- 宿主应用负责把 MCP 能力桥接到模型调用接口
- MCP 本身并不强制规定一定要怎么接入某个具体模型

因此，**MCP 不是 Function Calling 的替代品，也不是简单的升级版，而是位于其上的一层工程化协议。**

### 一张表看清两者差异

| 维度 | Function Calling | MCP |
| --- | --- | --- |
| 关注点 | 一次调用怎么表达 | 工具如何被标准化接入 |
| 抽象层次 | 模型调用层 | 工具协议层 |
| 是否支持能力发现 | 通常不负责 | 支持 |
| 是否支持跨客户端复用 | 弱 | 强 |
| 是否只包含工具 | 基本是 | 不是，还包括 Resources 和 Prompts |
| 是否规定底层通信 | 不关心 | 关心，定义协议与传输方式 |

![MCP 与 Function Calling 的区别与关系](https://obsidian-1309391399.cos.ap-shanghai.myqcloud.com/Image/mcp-vs-fc-1.png)

## 一个最小工作流：MCP 在宿主应用里是怎么工作的

从宿主应用视角看，一个 MCP 工具调用通常会经历以下步骤：

1. 宿主应用启动或连接一个 MCP Server。
2. Host 为这个 Server 创建一个 MCP Client，并完成初始化握手。
3. Client 通过 `tools/list`、`resources/list` 等接口拉取可用能力。
4. 宿主应用把这些能力组织成模型可理解的上下文。
5. 模型决定是否调用某个工具。
6. Host 将调用请求路由到对应的 MCP Server。
7. Server 返回结果，Host 再把结果交给模型继续推理或组织最终答案。

概括来说，MCP 负责标准化接入外部能力，模型负责基于上下文决定是否调用，而宿主应用负责完成两者之间的桥接与调度。

## 什么时候适合用 MCP

如果场景只是：

- 在单个项目里临时接一两个工具
- 没有跨应用复用需求
- 不想引入额外进程或协议层

那么直接使用 Function Calling 通常已经足够。

但在以下场景中，MCP 的价值会更加明显：

- 工具越来越多，想统一管理
- 同一套工具要给多个 AI 客户端复用
- 希望工具支持自动发现，而不是每个项目手写一遍
- 需要同时暴露工具、只读资源和提示模板
- 希望接入现成的社区或官方 MCP Server

尤其在 Agent 系统中，MCP 很适合作为统一的外部能力接入层。

## 写在最后

MCP 的意义不在于发明了工具调用，而在于为工具接入、资源暴露和提示模板复用提供了一套统一协议。它降低了工具生态的集成成本，也为跨客户端复用和能力发现提供了基础。

如果只把 MCP 理解为“另一种函数调用方式”，很难准确把握它的设计目标。更合适的理解是：它为 AI 应用接入外部世界提供了统一的协议层。

最后可以概括为：

**Function Calling 解决的是模型怎么发起一次调用，MCP 解决的是整个工具生态怎么被标准化接入。**

## 参考

- Model Context Protocol 官方文档：Architecture overview  
  https://modelcontextprotocol.io/docs/learn/architecture
- Model Context Protocol 官方文档：Understanding MCP servers  
  https://modelcontextprotocol.io/docs/learn/server-concepts
