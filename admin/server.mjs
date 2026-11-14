#!/usr/bin/env node
/**
 * 本地管理后台（仅监听 127.0.0.1，不对外暴露）
 * 职责：读写 Markdown、读写站点配置、执行 git 提交与推送
 * 启动：npm run admin  →  http://127.0.0.1:7788
 */
import { createServer } from 'node:http';
import { readFile, writeFile, readdir, unlink, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const POSTS_DIR = path.join(ROOT, 'src', 'data', 'posts');
const RES_DIR = path.join(ROOT, 'src', 'data', 'resources');
const SITE_FILE = path.join(ROOT, 'src', 'config', 'site.json');
const UI_FILE = path.join(HERE, 'ui', 'index.html');
const PORT = Number(process.env.ADMIN_PORT || 7788);
const HOST = '127.0.0.1';

/* ------------------------------ 工具 ------------------------------ */

function json(res, code, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function unquote(s) {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

function parseMd(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: text };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf(':');
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (!val) {
      data[key] = '';
      continue;
    }
    if (val.startsWith('[') && val.endsWith(']')) {
      data[key] = val
        .slice(1, -1)
        .split(',')
        .map((s) => unquote(s))
        .filter(Boolean);
    } else if (/^(true|false)$/i.test(val)) {
      data[key] = /^true/i.test(val);
    } else if (/^-?\d+(\.\d+)?$/.test(val)) {
      data[key] = Number(val);
    } else {
      data[key] = unquote(val);
    }
  }
  return { data, body: text.slice(m[0].length).replace(/^\s*\n/, '') };
}

function toYamlValue(v) {
  if (Array.isArray(v)) return `[${v.map((x) => JSON.stringify(String(x))).join(', ')}]`;
  if (typeof v === 'boolean' || typeof v === 'number') return String(v);
  return JSON.stringify(String(v ?? ''));
}

function toMd(data, body) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (typeof v === 'string' && v.trim() === '') continue;
    lines.push(`${k}: ${toYamlValue(v)}`);
  }
  lines.push('---', '');
  return lines.join('\n') + (body ?? '').replace(/\r\n/g, '\n') + '\n';
}

function safeSlug(slug) {
  const s = String(slug || '').trim();
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,80}$/.test(s)) return null;
  return s;
}

function makeSlug(title) {
  const ascii = String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return ascii ? `${stamp}-${ascii}` : `${stamp}-post-${Math.random().toString(36).slice(2, 6)}`;
}

async function readCollection(dir) {
  if (!existsSync(dir)) return [];
  const files = (await readdir(dir)).filter((f) => f.toLowerCase().endsWith('.md'));
  const items = await Promise.all(
    files.map(async (f) => {
      const text = await readFile(path.join(dir, f), 'utf8');
      const { data, body } = parseMd(text);
      return { slug: f.replace(/\.md$/i, ''), data, body };
    })
  );
  return items.sort((a, b) => String(b.data.updated || b.data.pubDate || '').localeCompare(String(a.data.updated || a.data.pubDate || '')));
}

async function git(args) {
  const { stdout, stderr } = await exec('git', args, { cwd: ROOT, windowsHide: true });
  return (stdout || stderr || '').trim();
}

async function gitInfo() {
  const info = { branch: '', remote: '', status: '', lastCommit: '' };
  try { info.branch = await git(['rev-parse', '--abbrev-ref', 'HEAD']); } catch {}
  try { info.remote = await git(['remote', 'get-url', 'origin']); } catch {}
  try { info.status = await git(['status', '--porcelain']); } catch {}
  try { info.lastCommit = await git(['log', '-1', '--pretty=%h %s (%cr)']); } catch {}
  return info;
}

async function readBody(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 4 * 1024 * 1024) throw new Error('请求体过大');
  }
  if (!raw) return {};
  return JSON.parse(raw);
}

/* ------------------------------ 路由 ------------------------------ */

async function handleApi(req, res, url) {
  const p = url.pathname;

  if (p === '/api/state' && req.method === 'GET') {
    const [posts, resources, site, g] = await Promise.all([
      readCollection(POSTS_DIR),
      readCollection(RES_DIR),
      readFile(SITE_FILE, 'utf8').then(JSON.parse),
      gitInfo(),
    ]);
    return json(res, 200, { posts, resources, site, git: g, root: ROOT });
  }

  if (p === '/api/post' && req.method === 'POST') {
    const { slug, data, body, create } = await readBody(req);
    const finalSlug = safeSlug(slug) ?? makeSlug(data?.title);
    if (!finalSlug) return json(res, 400, { error: 'slug 只能包含字母、数字、连字符和下划线' });
    const file = path.join(POSTS_DIR, `${finalSlug}.md`);
    if (create && existsSync(file)) return json(res, 409, { error: `已存在 ${finalSlug}.md` });
    await writeFile(file, toMd(data, body), 'utf8');
    return json(res, 200, { ok: true, slug: finalSlug });
  }

  if (p === '/api/post' && req.method === 'DELETE') {
    const slug = safeSlug(url.searchParams.get('slug'));
    if (!slug) return json(res, 400, { error: 'slug 非法' });
    const file = path.join(POSTS_DIR, `${slug}.md`);
    if (!existsSync(file)) return json(res, 404, { error: '文章不存在' });
    await unlink(file);
    return json(res, 200, { ok: true });
  }

  if (p === '/api/resource' && req.method === 'POST') {
    const { slug, data, body, create } = await readBody(req);
    const finalSlug = safeSlug(slug) ?? makeSlug(data?.title);
    if (!finalSlug) return json(res, 400, { error: 'slug 非法' });
    const file = path.join(RES_DIR, `${finalSlug}.md`);
    if (create && existsSync(file)) return json(res, 409, { error: `已存在 ${finalSlug}.md` });
    await writeFile(file, toMd(data, body), 'utf8');
    return json(res, 200, { ok: true, slug: finalSlug });
  }

  if (p === '/api/resource' && req.method === 'DELETE') {
    const slug = safeSlug(url.searchParams.get('slug'));
    if (!slug) return json(res, 400, { error: 'slug 非法' });
    const file = path.join(RES_DIR, `${slug}.md`);
    if (!existsSync(file)) return json(res, 404, { error: '资源不存在' });
    await unlink(file);
    return json(res, 200, { ok: true });
  }

  if (p === '/api/site' && req.method === 'POST') {
    const { site } = await readBody(req);
    if (!site || typeof site !== 'object') return json(res, 400, { error: '站点配置格式不对' });
    await writeFile(SITE_FILE, JSON.stringify(site, null, 2) + '\n', 'utf8');
    return json(res, 200, { ok: true });
  }

  if (p === '/api/publish' && req.method === 'POST') {
    const { message } = await readBody(req);
    const info = await gitInfo();
    if (!info.remote) {
      return json(res, 400, {
        error: '还没有配置远端仓库。先在 GitHub 建仓库，然后执行：git remote add origin <仓库地址>',
      });
    }
    const logs = [];
    try {
      logs.push(await git(['add', '-A']));
      const statusNow = await git(['status', '--porcelain']);
      if (!statusNow) {
        return json(res, 200, { ok: true, logs: ['没有需要提交的改动'], pushed: false });
      }
      const msg = (message || '').trim() || `admin: 更新内容 ${new Date().toLocaleString('zh-CN')}`;
      logs.push(await git(['commit', '-m', msg]));
      logs.push(await git(['push']));
      return json(res, 200, { ok: true, logs: logs.filter(Boolean), pushed: true });
    } catch (e) {
      logs.push(String(e.stderr || e.message || e).trim());
      return json(res, 500, { error: '发布失败', logs: logs.filter(Boolean) });
    }
  }

  return json(res, 404, { error: '接口不存在' });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);
  try {
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);

    if (url.pathname === '/' || url.pathname === '/index.html') {
      const html = await readFile(UI_FILE, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(html);
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('not found');
  } catch (e) {
    json(res, 500, { error: String(e.message || e) });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n  本地管理后台已启动 → http://${HOST}:${PORT}\n  工作目录：${ROOT}\n  按 Ctrl+C 退出\n`);
});
