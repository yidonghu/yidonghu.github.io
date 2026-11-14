# yidonghu 个人博客

终端极客风格的个人站点，Astro 构建，托管 GitHub Pages。含独立「资源分享」分区与本地管理后台。

- 线上地址：[https://yidonghu.github.io](https://yidonghu.github.io)（已部署，Push 后约 40 秒更新）
- 本地预览：`npm run dev` → http://localhost:4321
- 本地后台：`npm run admin` → http://127.0.0.1:7788

---

## 一键启动（Windows）

双击仓库根目录下的两个 bat 即可，不需要开终端：

| 文件 | 作用 |
| --- | --- |
| `启动管理后台.bat` | 启动后台并自动打开 http://127.0.0.1:7788 |
| `启动本地预览.bat` | 启动本地预览并自动打开 http://127.0.0.1:4321 |

脚本会自己处理这几种情况：

- **找 Node**：先用 PATH 里的 `node`，没有则回退到 `C:\Program Files\nodejs\node.exe`；都找不到会提示去 nodejs.org 安装；
- **首次运行**：`node_modules` 不存在时自动 `npm install`；
- **重复启动**：检测到服务已在运行，就只打开浏览器，不会报端口占用；
- **开浏览器时机**：轮询到服务真正响应后才打开，不会出现「连接被拒绝」。

服务跑在当前的黑色窗口里，**关掉窗口即停止服务**（不会在后台残留进程）。

## 目录结构

```
blog_v2.0/
├─ src/
│  ├─ config/
│  │  ├─ site.json          # 站点信息 + 布局开关（改布局只改这里）
│  │  └─ site.ts            # 读取配置并生成 CSS 变量
│  ├─ data/
│  │  ├─ posts/*.md         # 文章
│  │  └─ resources/*.md     # 资源分享
│  ├─ layouts/BaseLayout.astro
│  ├─ components/           # PostCard / ResourceCard / TagPill
│  ├─ pages/                # 首页、文章、标签、归档、资源、关于、RSS、404
│  ├─ lib/content.ts        # Markdown 读取、排序、标签统计
│  └─ styles/global.css     # 全部样式（含明暗两套主题）
├─ admin/
│  ├─ server.mjs            # 本地后台服务（零依赖，仅监听 127.0.0.1）
│  └─ ui/index.html         # 后台界面
├─ public/favicon.svg
└─ .github/workflows/deploy.yml
```

---

## 发一篇文章

在 `src/data/posts/` 新建 `xxx.md`：

```yaml
---
title: "标题"
description: "一句话摘要，用于列表页和 SEO"
pubDate: 2026-11-14
tags: ["Astro", "随笔"]
category: "技术"
draft: false
pinned: false
---

正文用 Markdown 写。
```

`draft: true` 的文章不会进入构建。

文件名的 `xxx` 就是访问地址 `/posts/xxx/`，建议只用小写字母、数字和连字符。

## 加一条资源

在 `src/data/resources/` 新建 `xxx.md`：

```yaml
---
title: "资源名称"
platform: baidu          # baidu / quark / aliyun / lanzou / github
url: "https://pan.baidu.com/s/xxxx"
code: "8x2k"            # 没有提取码就留空
size: "4.7 MB"
updated: 2026-11-12
tags: ["笔记", "模板"]
status: ok              # ok 有效 / pending 待补 / dead 已失效
summary: "一句话说明"
---

使用说明（Markdown，可留空）。
```

- `status: dead` 的卡片会变灰但仍保留，方便回头补链接；
- 卡片上「报告失效」按钮会打开预填模板的 GitHub Issue。

> 示例里的网盘链接是占位符（`替换成你的分享ID`），正式发布前要换成真实链接。

## 调整布局

改 `src/config/site.json` 的 `layout` 段，重新构建即生效：

| 字段                                 | 取值                            | 作用                           |
| ------------------------------------ | ------------------------------- | ------------------------------ |
| `listStyle`                        | `rows` / `cards`            | 文章列表是命令行行式还是卡片式 |
| `tocPosition`                      | `right` / `hidden`          | 文章目录位置                   |
| `width`                            | 如 `76rem`                    | 全站内容宽度                   |
| `defaultTheme`                     | `dark` / `light`            | 默认明暗                       |
| `accent` / `accentAlt`           | 色值                            | 暗色主题主色、辅助色           |
| `accentLight` / `accentAltLight` | 色值                            | 亮色主题对应的两个色           |
| `homeModules`                      | `intro,latest,resources,tags` | 首页模块顺序，可增删           |
| `showGrid`                         | `true` / `false`            | 背景网格                       |

深层改版才需要动 `src/layouts/` 或 `src/components/`，内容文件完全不用碰。

## 管理后台

```bash
npm run admin
```

浏览器打开 http://127.0.0.1:7788，四个模块：

- **文章**：新建 / 编辑 / 删除，Markdown 编辑 + 预览，草稿与置顶开关
- **资源**：网盘类型、链接、提取码、状态可视化增删改
- **站点设置**：站名、社交链接、列表样式、主题色等，改动直接写回 `site.json`
- **发布**：查看 git 状态 → 一键 commit + push（附构建状态说明）

后台只监听本机回环地址，不对外网开放；所有删除都走文件删除，可被 git 回滚。

## 部署到 GitHub Pages

1. 在 GitHub 建仓库，仓库名必须是 `yidonghu.github.io`（这样站点根地址才是 `https://yidonghu.github.io`）。
2. 本地关联远端并推送：

```bash
git remote add origin https://github.com/yidonghu/yidonghu.github.io.git
git push -u origin main
```

3. 仓库 `Settings → Pages → Build and deployment`，Source 选 **GitHub Actions**。
4. 首次推送后 Actions 会自动构建，约 1～2 分钟可访问。

本仓库已单独设置提交身份，不影响全局 git 配置：

```
user.name  = yidonghu
user.email = yidonghu1001@163.com
```

## 常用命令

| 命令                | 作用                     |
| ------------------- | ------------------------ |
| `npm run dev`     | 本地开发预览，热更新     |
| `npm run build`   | 生成静态文件到 `dist/` |
| `npm run preview` | 预览构建产物             |
| `npm run admin`   | 启动本地管理后台         |

## 还没做的（下一步）

- 评论：接 giscus（基于 GitHub Discussions，静态站零后端）
- B站最新投稿：要么手动维护卡片，要么 Actions 定时抓取（接口有 wbi 签名与风控，失败需静默降级）
- 站内搜索目前是前端过滤标题/标签/摘要，文章量大后可换 Pagefind 建索引
