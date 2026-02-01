---
title: "测试文章 - 博客自动发布"
published: 2026-02-01
tags:
  - 测试
lang: zh
toc: true
abbrlink: test-blog-auto-publish
draft: false
---

# 测试文章 - 博客自动发布

这是一篇测试文章，用于验证博客自动发布系统是否正常工作。

## 测试内容

- 测试 Draft 中 `draft: false` 的文章能否自动发布
- 测试自动同步到 StarDust
- 测试 Git 自动提交和推送
- 测试 GitHub Actions 自动构建

## 预期结果

1. 文件从 `Draft/` 复制到 `Posts/`
2. 文件同步到 `StarDust/src/content/posts/`
3. Git 提交并推送到 GitHub
4. GitHub Actions 自动构建和部署
5. 文章出现在 https://stardustorz.github.io/

---

**发布时间**: 2026-02-01 22:00（自动）
