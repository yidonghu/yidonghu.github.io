import type { APIRoute } from 'astro';
import { getAllPosts } from '../lib/content';
import { site } from '../config/site';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const GET: APIRoute = () => {
  const base = (site as any).url ?? 'https://yidonghu.github.io';
  const posts = getAllPosts().slice(0, 20);
  const items = posts
    .map((p) => {
      const link = `${base}/posts/${p.slug}/`;
      return `    <item>
      <title>${esc(p.data.title ?? p.slug)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(p.data.pubDate).toUTCString()}</pubDate>
      <description>${esc(p.data.description ?? '')}</description>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(site.title)}</title>
    <link>${base}</link>
    <description>${esc(site.description)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
