---
title: "本站同款 Astro 博客模板"
platform: github
url: "https://github.com/yidonghu/yidonghu.github.io"
repo: "https://github.com/yidonghu/yidonghu.github.io"
size: "约 1.2 MB"
updated: 2026-11-14
tags: ["Astro", "模板", "源码"]
status: ok
summary: "本站用的就是这份代码：终端风格主题、资源分区、本地管理后台，克隆下来改配置就能用。"
---

## 包含内容

本站的完整源码：终端风格主题（明暗两套）、独立资源分区（四类网盘筛选 + 链接/提取码分开复制）、本地零依赖管理后台、Windows 一键启动脚本、GitHub Actions 部署流水线。

## 快速开始

```bash
git clone https://github.com/yidonghu/yidonghu.github.io
cd yidonghu.github.io
npm install
npm run dev
```

## 改成你自己的站

1. 改 `src/config/site.json`：站名、简介、社交链接、布局开关、主题色
2. 清掉 `src/data/posts/` 与 `src/data/resources/` 里的示例内容
3. 仓库改名成 `你的用户名.github.io`，`Settings → Pages` 的 Source 选 **GitHub Actions**

## 许可

代码可自由使用，注明来源即可；示例文章与资源条目里的文字请替换成你自己的内容。
