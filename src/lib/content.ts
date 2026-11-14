type MdModule = {
  frontmatter?: Record<string, any>;
  default?: any;
  rawContent?: string | Uint8Array | (() => string);
  getHeadings?: () => Array<{ depth: number; slug: string; text: string }>;
};

export type Post = {
  slug: string;
  data: Record<string, any>;
  Content: any;
  body: string;
  headings: Array<{ depth: number; slug: string; text: string }>;
  readingTime: number;
};

export type Resource = {
  slug: string;
  data: Record<string, any>;
  Content: any;
  body: string;
};

const postModules = import.meta.glob('../data/posts/*.md', { eager: true }) as Record<string, MdModule>;
const resourceModules = import.meta.glob('../data/resources/*.md', { eager: true }) as Record<string, MdModule>;

/** 不同版本的 Markdown 模块对 rawContent 的暴露方式不一致，这里统一成字符串 */
function rawOf(mod: MdModule): string {
  const rc = mod.rawContent as any;
  if (typeof rc === 'string') return rc;
  if (typeof rc === 'function') {
    try {
      const v = rc();
      return typeof v === 'string' ? v : '';
    } catch {
      return '';
    }
  }
  if (rc instanceof Uint8Array) return new TextDecoder().decode(rc);
  return '';
}

function slugOf(filePath: string): string {
  return filePath.split('/').pop()!.replace(/\.md$/, '');
}

/** Markdown 标题在无法调用 getHeadings 时的兜底解析 */
function headingsFromBody(body: string) {
  const out: Array<{ depth: number; slug: string; text: string }> = [];
  const lines = body.split('\n');
  let inFence = false;
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (inFence) continue;
    const m = line.match(/^(#{2,3})\s+(.+?)\s*#*\s*$/);
    if (!m) continue;
    const text = m[2].trim();
    const slug = text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .trim()
      .replace(/\s+/g, '-');
    out.push({ depth: m[1].length, slug, text });
  }
  return out;
}

function readingTimeOf(body: string): number {
  const cjk = (body.match(/[\u4e00-\u9fa5]/g) || []).length;
  const words = body.replace(/[\u4e00-\u9fa5]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(cjk / 400 + words / 200));
}

export function getAllPosts(): Post[] {
  return Object.entries(postModules)
    .map(([path, mod]) => {
      const data = mod.frontmatter ?? {};
      const body = rawOf(mod);
      let headings: Array<{ depth: number; slug: string; text: string }> = [];
      try {
        headings = typeof mod.getHeadings === 'function' ? mod.getHeadings() : [];
      } catch {
        headings = [];
      }
      if (!headings.length) headings = headingsFromBody(body);
      return {
        slug: slugOf(path),
        data,
        Content: mod.default,
        body,
        headings,
        readingTime: readingTimeOf(body),
      };
    })
    .filter((p) => !p.data.draft)
    .sort((a, b) => new Date(b.data.pubDate).getTime() - new Date(a.data.pubDate).getTime());
}

export function getPostSlugs(): string[] {
  return getAllPosts().map((p) => p.slug);
}

export function getAllResources(): Resource[] {
  return Object.entries(resourceModules)
    .map(([path, mod]) => ({
      slug: slugOf(path),
      data: mod.frontmatter ?? {},
      Content: mod.default,
      body: rawOf(mod),
    }))
    .sort((a, b) => new Date(b.data.updated ?? 0).getTime() - new Date(a.data.updated ?? 0).getTime());
}

export function allTags(posts: Post[] = getAllPosts()): Array<{ tag: string; count: number }> {
  const map = new Map<string, number>();
  for (const p of posts) {
    const tags: string[] = Array.isArray(p.data.tags) ? p.data.tags : [];
    for (const t of tags) map.set(t, (map.get(t) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function formatDate(value: string | Date): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}
