# yidonghu 个人博客

终端极客风格的个人站点，Astro 5 静态构建，托管在 GitHub Pages。含独立「资源分享」分区、明暗双主题、本地零依赖管理后台与 Windows 一键启动脚本。

| 项 | 地址 |
| --- | --- |
| 线上站点 | https://yidonghu.github.io |
| 仓库 | https://github.com/yidonghu/yidonghu.github.io |
| 本地预览（`npm run dev`） | http://localhost:4321 |
| 本地后台（`npm run admin`） | http://127.0.0.1:7788 |

推送 `main` 后由 GitHub Actions 自动构建部署，约 1 分钟生效。

---

## 一键启动（Windows）

双击仓库根目录的两个 bat 即可，不用开终端：

| 文件 | 作用 |
| --- | --- |
| `启动管理后台.bat` | 启动后台并自动打开 http://127.0.0.1:7788 |
| `启动本地预览.bat` | 启动本地预览（`astro dev`）并自动打开 http://localhost:4321 |

脚本会自己处理这几种情况：

- **找 Node**：先用 PATH 里的 `node`，没有则回退 `C:\Program Files\nodejs\node.exe`；都没有会提示去 nodejs.org 装
- **首次运行**：`node_modules` 不存在时自动 `npm install`
- **重复启动**：检测到服务已在响应，只打开浏览器，不报端口占用
- **开浏览器时机**：轮询到服务真正返回 200 才打开，不会开出「连接被拒绝」的空页

服务跑在当前窗口里，**关掉窗口即停止服务**，不残留后台进程。

## 目录结构

```
blog_v2.0/
├─ src/
│  ├─ config/
│  │  ├─ site.json          # 站点信息 + 布局开关（改布局只改这里）
│  │  └─ site.ts            # 读配置、导出 site/layout、注入 CSS 变量
│  ├─ data/
│  │  ├─ posts/*.md         # 文章
│  │  └─ resources/*.md     # 资源分享
│  ├─ layouts/BaseLayout.astro
│  ├─ components/           # PostCard / ResourceCard / TagPill
│  ├─ pages/                # 首页、文章、标签、归档、资源、关于、RSS、404
│  ├─ lib/content.ts        # 读取 Markdown、排序、标题、阅读时长、标签统计
│  └─ styles/global.css     # 全站样式（含明暗两套变量）
├─ admin/
│  ├─ server.mjs            # 本地后台服务（零依赖，仅监听 127.0.0.1）
│  └─ ui/index.html         # 后台界面（单文件）
├─ public/favicon.svg
├─ 启动管理后台.bat
├─ 启动本地预览.bat
└─ .github/workflows/deploy.yml
```

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm install` | 装依赖（仅首次） |
| `npm run dev` | 本地开发预览，热更新，端口 4321 |
| `npm run build` | 生成静态文件到 `dist/` |
| `npm run preview` | 预览 `dist/` 构建产物 |
| `npm run admin` | 启动本地管理后台 |

## 发一篇文章

在 `src/data/posts/` 新建 `xxx.md`，文件名即访问地址 `/posts/xxx/`（建议小写字母、数字、连字符）：

```yaml
---
title: "标题"
description: "一句话摘要，用于列表页与 SEO"
pubDate: 2026-11-14
tags: ["Astro", "随笔"]
category: "随笔"
draft: false
pinned: false
---
```

- `draft: true` 不参与构建
- `pinned: true` 排在最前
- 阅读时长按中文 400 字/分钟、英文 200 词/分钟自动估算
- 正文里的 `##` / `###` 标题会自动生成右侧目录

## 加一条资源

在 `src/data/resources/` 新建 `xxx.md`：

```yaml
---
title: "资源名称"
platform: "baidu"                 # baidu / quark / aliyun / lanzou / github
url: "https://pan.baidu.com/s/xxxx"
code: "8x2k"                      # 提取码，没有就留空
repo: "https://github.com/xxx/yyy" # 可选：源码仓库，填了才显示「GitHub 仓库」按钮
size: "4.7 MB"
updated: 2026-11-12
status: "ok"                      # ok 有效 / pending 待补 / dead 已失效
tags: ["模板", "源码"]
summary: "一句话说明"
---
```

字段说明：

| 字段 | 作用 |
| --- | --- |
| `platform` | 决定卡片徽章颜色与资源页筛选分组 |
| `url` / `code` | 分别对应「复制链接」「复制提取码」两个按钮，二者独立 |
| `repo` | 额外的「GitHub 仓库」入口，与网盘链接互不影响 |
| `status: dead` | 卡片变灰并标注「已失效」，仍保留，方便回头补链接 |

资源页支持按平台筛选、只看有效、按更新时间排序；每张卡上的「报告失效」会打开预填标题与正文的 GitHub Issue（零后端）。

## 调整布局

改 `src/config/site.json`，重新构建即生效：

| 字段 | 取值 | 作用 |
| --- | --- | --- |
| `nav` | 数组 | 顶栏导航文字与链接 |
| `listStyle` | `rows` / `cards` | 文章列表是命令行行式还是卡片式 |
| `tocPosition` | `right` / `hidden` | 文章目录位置（窄屏自动移到正文上方） |
| `width` | 如 `76rem` | 全站内容宽度 |
| `defaultTheme` | `dark` / `light` | 新访客的默认明暗（之后跟随访客手动切换） |
| `accent` / `accentAlt` | 色值 | 暗色主题主色、辅助色 |
| `accentLight` / `accentAltLight` | 色值 | 亮色主题对应的两个色 |
| `homeModules` | `intro,latest,resources,tags` | 首页模块顺序，可增删 |
| `excerptLines` | 数字 | 卡片摘要行数 |
| `showGrid` | `true` / `false` | 背景网格 |

## 主题

- 明暗两套变量都写在 `src/styles/global.css` 顶部，切换按钮在顶栏右侧，状态存 `localStorage`，首屏内联脚本防闪
- 亮色主题是低眩光纸感配色，实测对比度：正文 11.33:1、摘要 6.22:1、小字 4.78:1、链接 6.34:1（WCAG AA 全部达标）
- 平台徽章在亮色下单独一套深色值（6.6～8.6:1），避免浅色徽章在浅底上看不清
- 代码块用 Shiki（`github-dark-dimmed`），样式由构建时内联，切换主题不改配色

## 管理后台

```bash
npm run admin
```

打开 http://127.0.0.1:7788（端口可用 `ADMIN_PORT` 改），四个页签：

| 页签 | 能力 |
| --- | --- |
| 文章 | 新建 / 编辑 / 删除，Markdown 编辑 + 实时预览，草稿、置顶开关 |
| 资源 | 网盘类型、链接、提取码、GitHub 仓库、状态、标签、简介的增删改 |
| 站点设置 | 站名、简介、社交链接、列表样式、主题色、首页模块等，直接写回 `site.json` |
| 发布 | 查看改动清单（git status）→ 一键 `add + commit + push` |

接口一览（服务端零依赖，只监听回环地址）：

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| GET | `/api/state` | 文章 + 资源 + 站点配置 + git 状态 |
| POST | `/api/post` | 写入文章（`create: true` 时拒绝覆盖同名文件） |
| DELETE | `/api/post?slug=` | 删除文章 |
| POST | `/api/resource` | 写入资源 |
| DELETE | `/api/resource?slug=` | 删除资源 |
| POST | `/api/site` | 写回 `site.json` |
| POST | `/api/publish` | `git add -A` → commit → push |

所有删除都是文件删除，可被 git 回滚；没有远端时 `/api/publish` 会返回明确提示而不是静默失败。

## 部署到 GitHub Pages

1. 仓库名必须是 `<用户名>.github.io`，站点根地址才是 `https://<用户名>.github.io`
2. 关联远端并推送：

```bash
git remote add origin https://github.com/<用户名>/<用户名>.github.io.git
git push -u origin main
```

3. 仓库 `Settings → Pages → Build and deployment`，Source 选 **GitHub Actions**（选 `Deploy from a branch` 会把 Astro 源码当 Jekyll 编译，结果必然白屏）
4. 推送后 Actions 自动构建，约 1 分钟可访问

流水线在 `.github/workflows/deploy.yml`：`actions/checkout@v4` → `withastro/action@v3`（Node 22）→ `actions/deploy-pages@v4`，权限需要 `contents: read`、`pages: write`、`id-token: write` 三项，缺一不可。

本仓库单独设置了提交身份，不影响全局配置：

```
user.name  = yidonghu
user.email = yidonghu1001@163.com
```

## 常见问题

**推送后线上还是旧内容**

浏览器缓存。`Ctrl + Shift + R` 强刷；Actions 里确认最新一次工作流是绿色。

**首页白屏、样式全丢**

`Settings → Pages` 的 Source 还停在 `Deploy from a branch`。改成 **GitHub Actions**。

**构建出来的页数突然变少**

`src/data/posts`、`src/data/resources` 里有文件被删，或文章被标了 `draft: true`。用 `git status` 看有没有 `D` 记录，`git checkout -- src/data` 可恢复。

**bat 双击闪退 / 中文乱码**

两个 bat 都是 UTF-8 无 BOM + CRLF。用记事本改过并另存成「UTF-8 带 BOM」会让首行 `@echo off` 失效，需要改回无 BOM。

**后台提示「已存在 xxx.md」**

同名文件已存在，换一个 slug，或先在文章页签删掉旧的。

**资源页的筛选没反应**

筛选是纯前端脚本，检查浏览器控制台是否有报错；平台值必须是 `baidu / quark / aliyun / lanzou / github` 之一。

## 尚未实现

- 评论：计划接 giscus（基于 GitHub Discussions，静态站零后端）
- B站最新投稿：手动维护卡片，或 Actions 定时抓取（接口有 wbi 签名与风控，失败需静默降级）
- 站内搜索目前是前端过滤标题/标签/摘要，文章量上百后可换 Pagefind 建索引

## 许可

站点代码基于 Astro 构建，可自由参考；文章与资源条目内容版权归作者所有，转载请注明出处。
