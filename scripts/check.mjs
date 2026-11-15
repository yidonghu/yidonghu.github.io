#!/usr/bin/env node
/**
 * 内容体检：构建前跑一遍，提前发现问题而不是等 Actions 报错。
 * 用法：npm run check
 * 退出码：0 无错误（可能有警告）；1 有错误。
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ERRORS = [];
const WARNS = [];

function readJson(file, label) {
  const p = path.join(ROOT, file);
  if (!existsSync(p)) {
    ERRORS.push(`${label}：文件不存在 ${file}`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch (e) {
    ERRORS.push(`${label}：JSON 语法错误 ${file} → ${e.message}`);
    return null;
  }
}

/** 与后台 server.mjs 的 parseMd 保持同一套简单规则 */
function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: text };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf(':');
    if (i < 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (!val) {
      data[key] = '';
      continue;
    }
    if (val.startsWith('[') && val.endsWith(']')) {
      data[key] = val
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else {
      val = val.replace(/^["']|["']$/g, '');
      if (/^(true|false)$/i.test(val)) data[key] = /^true/i.test(val);
      else data[key] = val;
    }
  }
  return { data, body: text.slice(m[0].length) };
}

function collect(dir) {
  const abs = path.join(ROOT, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs)
    .filter((f) => f.toLowerCase().endsWith('.md'))
    .sort()
    .map((f) => {
      const text = readFileSync(path.join(abs, f), 'utf8');
      return { file: `${dir}/${f}`, slug: f.replace(/\.md$/i, ''), ...parseFrontmatter(text) };
    });
}

const isUrl = (v) => /^https?:\/\//i.test(String(v || ''));
const isDate = (v) => !Number.isNaN(new Date(String(v)).getTime());
const PLATFORMS = ['baidu', 'quark', 'aliyun', 'lanzou', 'github', 'magnet'];
const STATUSES = ['ok', 'pending', 'dead'];
const PLACEHOLDERS = ['替换成', 'your-share-id', 'xxxx', '示例'];

/* ---------- 配置 ---------- */
readJson('app.config.json', '本地配置');
const site = readJson('src/config/site.json', '站点配置');
if (site) {
  const need = ['title', 'tagline', 'description', 'github', 'bilibili', 'email'];
  for (const k of need) if (!site[k]) ERRORS.push(`站点配置：缺少 ${k}`);
  if (site.github && !isUrl(site.github)) ERRORS.push('站点配置：github 不是合法 URL');
  if (site.bilibili && !isUrl(site.bilibili)) ERRORS.push('站点配置：bilibili 不是合法 URL');
  if (!Array.isArray(site.nav) || site.nav.length === 0) WARNS.push('站点配置：nav 为空，顶栏不会显示导航');
  if (site.layout?.defaultTheme && !['dark', 'light'].includes(site.layout.defaultTheme)) {
    ERRORS.push(`站点配置：layout.defaultTheme 只能是 dark / light，当前为 ${site.layout.defaultTheme}`);
  }
}

/* ---------- 文章 ---------- */
const posts = collect('src/data/posts');
let drafts = 0;
for (const p of posts) {
  if (!p.slug.match(/^[a-z0-9][a-z0-9_-]*$/i)) WARNS.push(`${p.file}：文件名建议只用字母、数字、连字符`);
  if (!p.data.title) ERRORS.push(`${p.file}：缺少 title`);
  if (!p.data.pubDate) ERRORS.push(`${p.file}：缺少 pubDate`);
  else if (!isDate(p.data.pubDate)) ERRORS.push(`${p.file}：pubDate 不是合法日期（${p.data.pubDate}）`);
  if (!p.data.description) WARNS.push(`${p.file}：缺少 description，列表页与 SEO 会空着`);
  if (p.data.draft === true) drafts += 1;
}

/* ---------- 资源 ---------- */
const resources = collect('src/data/resources');
for (const r of resources) {
  if (!r.data.title) ERRORS.push(`${r.file}：缺少 title`);
  if (!r.data.platform) ERRORS.push(`${r.file}：缺少 platform`);
  else if (!PLATFORMS.includes(r.data.platform)) {
    ERRORS.push(`${r.file}：platform 只能是 ${PLATFORMS.join(' / ')}，当前为 ${r.data.platform}`);
  }
  if (!r.data.url) ERRORS.push(`${r.file}：缺少 url`);
  else if (!isUrl(r.data.url)) ERRORS.push(`${r.file}：url 不是合法链接`);
  else if (PLACEHOLDERS.some((w) => r.data.url.includes(w))) ERRORS.push(`${r.file}：url 还是占位符，需要换成真实链接`);
  if (r.data.repo && !isUrl(r.data.repo)) ERRORS.push(`${r.file}：repo 不是合法链接`);
  if (!r.data.status) WARNS.push(`${r.file}：缺少 status，默认按 ok 处理`);
  else if (!STATUSES.includes(r.data.status)) ERRORS.push(`${r.file}：status 只能是 ok / pending / dead`);
  if (!r.data.summary) WARNS.push(`${r.file}：缺少 summary，卡片上没有说明文字`);
}

/* ---------- 输出 ---------- */
const line = (s) => process.stdout.write(s + '\n');
line('');
line('  内容体检');
line('  ─────────────────────────────────────────');
line(`  文章   ${String(posts.length).padStart(2)} 篇${drafts ? `（其中草稿 ${drafts} 篇不进构建）` : ''}`);
line(`  资源   ${String(resources.length).padStart(2)} 条`);
line(`  标签   ${new Set(posts.flatMap((p) => (Array.isArray(p.data.tags) ? p.data.tags : [])).concat(resources.flatMap((r) => (Array.isArray(r.data.tags) ? r.data.tags : [])))).size} 个`);
line('  ─────────────────────────────────────────');
if (WARNS.length) {
  line(`  警告 ${WARNS.length} 条`);
  for (const w of WARNS) line(`   ! ${w}`);
}
if (ERRORS.length) {
  line(`  错误 ${ERRORS.length} 条`);
  for (const e of ERRORS) line(`   x ${e}`);
  line('');
  process.exit(1);
}
line(drafts ? `  通过（草稿 ${drafts} 篇不会出现在构建里）` : '  通过，没有发现问题');
line('');
