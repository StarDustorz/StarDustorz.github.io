---
title: "限流算法：固定窗口、令牌桶与漏桶"
published: 2021-06-12
tags:
  - Algorithm
  - HighConcurrency
categories:
  - Algorithm
description: "比较常见限流算法的流量行为、适用场景与工程边界。"
lang: zh
toc: true
abbrlink: algorithm-rate-limit
draft: true
---
<!--more-->

> 整理于2026-10-03，依据见文末。

## 限流解决什么问题

限流器按某个维度控制一段时间内允许处理的请求量，保护服务容量并给过载请求明确反馈。规则要先说清对象（账号、租户、IP、接口或全局）、速率、突发额度和超限行为。限制入口请求并不等于服务一定可用，还要结合队列、超时、资源隔离和下游保护。

## 常见算法的行为

| 算法 | 做法与特点 | 主要取舍 |
| --- | --- | --- |
| 固定窗口 | 每个时间窗计数，到上限拒绝 | 实现轻，但窗口边界可能出现短时双倍突发 |
| 滑动日志／计数 | 按时间戳精确计数，或用相邻窗口估算当前速率 | 边界更平滑；日志存储或估算会增加成本 |
| 令牌桶 | 按速率补充令牌，容量限制可积攒的突发；请求消耗令牌 | 控制长期平均速率，同时允许受控突发 |
| 漏桶 | 请求进入队列，以稳定速率处理；队列满时拒绝 | 输出较平滑，但排队会增加延迟 |

AWS API Gateway 的节流说明以令牌桶配置速率与突发量，并明确其限制按 best-effort 处理，不应视作绝对硬上限。NGINX 的限流模块使用漏桶方式延迟超额请求，超过突发队列时再拒绝。选算法时应看服务是希望平滑处理、容忍突发，还是快速拒绝，而不是只比较名称。

## 工程落地与误区

分布式服务需确定计数状态是否共享、读改写是否原子、键是否有过期策略；每进程各自计数会让集群总额度随实例数变化。超限后可以快速拒绝或排队，客户端应遵循退避并避免重试风暴。监控放行、延迟、拒绝和队列长度，按真实负载校准参数。

固定窗口边缘的突发不代表实现错误，而是算法属性；令牌桶的突发容量与补充速率是两个参数。网关限流通常是保护措施，不保证永不超限，关键资源仍应设置服务端保护。Go 的本地令牌桶用法见 [[40_博客/Posts/Golang/包/time rate使用|time/rate 使用笔记]]。

## 参考

- [AWS API Gateway：Throttle requests to your HTTP APIs](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-throttling.html)（令牌桶与 best-effort 限制说明）。
- [NGINX：ngx_http_limit_req_module](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html)（漏桶、突发与延迟行为）。
