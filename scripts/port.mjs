#!/usr/bin/env node
/**
 * 读取 app.config.json 里的本地端口，供 bat 脚本使用。
 * 用法：node scripts/port.mjs admin|preview
 * 配置文件缺失或值非法时回退到默认端口。
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

const DEFAULT_PORTS = { admin: 7788, preview: 4321 };
const which = process.argv[2] === 'admin' ? 'admin' : 'preview';

let cfg = {};
try {
  cfg = JSON.parse(readFileSync(path.join(process.cwd(), 'app.config.json'), 'utf8'));
} catch {
  cfg = {};
}

const raw = Number(cfg?.local?.[which === 'admin' ? 'adminPort' : 'previewPort']);
const port = Number.isInteger(raw) && raw > 0 && raw < 65536 ? raw : DEFAULT_PORTS[which];
process.stdout.write(String(port));
