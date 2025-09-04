#!/bin/bash

# 进入你的博客目录
cd /Users/caotianlong/Documents/StarDust

# 执行Git操作
git add .
git commit -m "Auto-update: $(date +'%Y-%m-%d %H:%M:%S')"
git push
