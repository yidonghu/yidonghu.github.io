---
title: "Astro 部署到 GitHub Pages：从零到上线"
description: "仓库命名、Actions 配置、Pages 开关、路径踩坑，一次走完。"
pubDate: 2026-11-08
tags: ["Astro", "GitHub Pages", "部署"]
category: "技术"
draft: false
---

这篇是操作记录，照着做大概二十分钟能跑通。

## 一、仓库名决定站点地址

这一步最容易搞错：

- 仓库叫 `yidonghu.github.io` → 站点根地址是 `https://yidonghu.github.io`，没有子路径；
- 仓库叫 `blog` 之类的名字 → 地址变成 `https://yidonghu.github.io/blog`，所有绝对路径都要加前缀。

能用第一种就别用第二种。少配置一个 `base`，就少一类 404。

## 二、Actions 工作流

在 `.github/workflows/deploy.yml` 放这么一份：

```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: withastro/action@v3
        with:
          node-version: 22

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

三个权限一个都不能少。`pages: write` 少了部署会 403，`id-token: write` 少了 OIDC 校验过不去。

## 三、Pages 开关

`Settings → Pages → Build and deployment`，Source 选 **GitHub Actions**，不要选 Deploy from a branch。

选错的表现是：Actions 显示成功，但线上还是旧的，或者干脆 404。

## 四、常见问题

### 样式加载不出来

多半是 `astro.config.mjs` 里的 `site` 没写，或者写了错的域名。规范链接、RSS、站点地图都依赖它。

### 构建过了但页面 404

看 `build.format`。默认 `directory` 会生成 `posts/hello/index.html`，链接要带结尾斜杠；改成 `file` 就是 `posts/hello.html`，链接不能带斜杠。选一种就统一到底。

### 中文字体在 CI 里缺失

构建阶段只是生成静态文件，字体在浏览器端加载，一般不受影响。但如果用了本地字体文件，记得放 `public/` 而不是 `src/`。

## 小结

配置类的东西一次做好就再也不用碰。真正需要天天面对的只有 `src/content/` 下面那些 Markdown 文件——这也是我选这套方案的根本原因。
