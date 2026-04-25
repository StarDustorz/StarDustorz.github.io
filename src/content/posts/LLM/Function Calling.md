---
title: "[LLM] Function Calling"
published: 2026-04-24
description: 介绍 Function Calling 的工作原理、工具定义规范、调用流程与并行调用实践，以及背后的 SFT 和 RLHF 训练机制。
tags:
  - LLM
draft: false
toc: true
lang: zh
abbrlink: llm-function-calling
---

## 是什么

开发者用 JSON Schema 描述工具，传给模型。模型判断需要工具时，**不输出自然语言，而是输出结构化的 `tool_calls` JSON**，告诉你调哪个函数、参数是什么。你的代码执行后把结果塞回对话，模型再给出最终答案。

**本质：两轮对话 + 中间执行的闭环。**

---

## 为什么需要

没有 Function Calling 时，只能解析自然语言来判断模型「想」调什么工具——模型换个说法，解析逻辑就失效，根本无法标准化。

Function Calling 让模型直接输出结构化 JSON，开发者按格式解析即可，**准确率大幅提升，也统一了工具调用标准**。

---

## 工具定义

工具 Schema 是一份给模型看的「工具说明书」，核心字段是 `description`。

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            # ⚠️ description 写得越清晰，模型选择越准确
            "description": "查询指定城市的实时天气，包含气温、天气状况、风向风速，仅支持中国大陆城市",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "城市名称，如「北京」「上海」，不要带省份前缀"
                    },
                    "unit": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "description": "温度单位，默认摄氏度"
                    }
                },
                "required": ["city"]
            }
        }
    }
]
```

> **`description` 是关键**：写「获取天气」vs「查询指定城市的实时天气，仅支持中国大陆城市」，对模型判断准确率的影响差距显著。参数的 `description` 同理，格式要求、示例值、限制条件都要写进去。

---

## 调用流程

```
用户提问
  → [第一轮] 模型输出 tool_calls（finish_reason = "tool_calls"）
  → [中间执行] 你的代码解析并执行工具
  → [第二轮] 把 role: "tool" 结果塞回对话
  → 模型输出最终答案
```

```python
import openai, json

client = openai.OpenAI()
messages = [{"role": "user", "content": "北京今天天气怎么样？"}]

# 第一轮
response = client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    tools=tools,
    tool_choice="auto"  # auto=模型自决，required=强制调用
)
msg = response.choices[0].message

if msg.finish_reason == "tool_calls":
    tool_call = msg.tool_calls[0]
    func_args = json.loads(tool_call.function.arguments)  # {"city": "北京"}

    # 执行工具
    result = f"{func_args['city']}今天晴，15°C，东北风 3 级"

    # 第二轮
    messages.append(msg)
    messages.append({
        "role": "tool",
        "tool_call_id": tool_call.id,
        "content": result
    })
    final = client.chat.completions.create(model="gpt-4o", messages=messages, tools=tools)
    print(final.choices[0].message.content)
    # → 北京今天天气晴朗，气温 15°C，东北风 3 级，适合外出。
```

---

## 并行工具调用

模型可以在**一次响应里输出多个 `tool_calls`**，代码用 `asyncio.gather` 或多线程并发执行，一次性塞回结果。

**效果：串行多轮 → 一轮对话 + 并行执行，延迟大幅降低。**

> **前提**：工具间无依赖关系。有依赖（如先查订单号再查物流）的情况，模型会自动分轮串行。

---

## 能力是如何训练出来的

> 一句话：**SFT 教会怎么调，RLHF 教会什么时候调。**

### SFT：学会怎么调

给模型喂大量完整的工具调用对话样本，每条样本包含：工具定义 → 用户提问 → 结构化 JSON 调用 → 工具返回结果 → 最终答案。模型通过模仿学会整套流程。

**训练数据必须覆盖的场景：**

| 场景 | 说明 |
|------|------|
| 单工具调用 | 基础 |
| 多工具并行调用 | 没见过就不知道能并行 |
| 工具调用失败处理 | API 超时、参数错误等，要能恢复 |
| **不调工具直接回答** | 最容易忽略，缺少这类样本会导致「遇事就调工具」的惯性 |
| 多轮对话中的工具调用 | 正确引用历史工具结果 |

**训练数据来源：**
- **人工标注**：质量高，成本极高，只用于核心种子数据
- **模型自动生成（蒸馏）**：用强模型批量生成 + 人工抽查，是主流做法；隐患是错误样本会被下游模型一起学进去（幻觉传递）

### RLHF：校准该不该调

SFT 训完后，模型可能形成「遇事就调工具」的偏激倾向。RLHF 通过人类偏好打分来校准边界感。

**流程：**

1. **生成多样回答** — 对同一问题生成多种回答（直接回答、调工具、调错工具…）
2. **人类打分排序** — 标注员对回答质量排序（「北京天气」→ 调工具排第一；「1+1」→ 直接回答排第一）
3. **训练奖励模型（RM）** — 学会预测人类对各种回答的评分
4. **PPO 强化学习** — 用奖励信号持续调整主模型，使其趋向高分输出

> **为什么用 PPO？** 训练稳定不易崩，且内置 KL 散度约束，防止模型为讨好奖励模型而退化成「套话机器」——本质是在「追求高奖励」和「保持语言能力」之间走钢丝。
