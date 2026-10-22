// RSS 자동 생성: news/, areas/, guide/, cases/ 아래의 글(폴더/index.html)을 모아 rss.xml을 다시 만듭니다.
// GitHub Actions(.github/workflows/rss.yml)에서 자동 실행되며, 직접 실행할 때는: node scripts/build-rss.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const SITE = 'https://evaw-pet-grooming.co.kr';
const ROOT = process.cwd();
const SECTIONS = { news: '새소식', areas: '지역별 안내', guide: '애견미용 가이드', cases: '수강생 사례' };

const decode = (s) => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&nbsp;/g, ' ').replace(/&middot;/g, '·').replace(/&rarr;/g, '→').replace(/&amp;/g, '&');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const attr = (tag, name) => {
  const m = tag.match(new RegExp(name + '\\s*=\\s*(["\'])([\\s\\S]*?)\\1', 'i'));
  return m ? decode(m[2]) : '';
};
const metaContent = (html, key, value) => {
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    if (attr(tag, key).toLowerCase() === value.toLowerCase()) return attr(tag, 'content').trim();
  }
  return '';
};

// 사이트맵 lastmod (발행일이 없는 글의 대체 날짜)
const lastmod = {};
if (existsSync(join(ROOT, 'sitemap.xml'))) {
  const sm = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
  for (const m of sm.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = (m[1].match(/<loc>([^<]+)<\/loc>/) || [])[1];
    const lm = (m[1].match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1];
    if (loc && lm) lastmod[new URL(loc.trim()).pathname.replace(/\/?$/, '/')] = lm.trim();
  }
}
const gitAddedDate = (file) => {
  try {
    const out = execFileSync('git', ['log', '--diff-filter=A', '--follow', '--format=%cI', '--', file], { encoding: 'utf8' }).trim().split('\n');
    return out[out.length - 1] || '';
  } catch { return ''; }
};

const items = [];
for (const [section, category] of Object.entries(SECTIONS)) {
  const dir = join(ROOT, section);
  if (!existsSync(dir)) continue;
  for (const slug of readdirSync(dir).sort()) {
    const file = join(dir, slug, 'index.html');
    if (!statSync(join(dir, slug)).isDirectory() || !existsSync(file)) continue;
    const html = readFileSync(file, 'utf8');
    if (/<meta\b[^>]*name=["']robots["'][^>]*noindex/i.test(html)) continue; // 검색 제외 글은 RSS에서도 제외
    const path = `/${section}/${slug}/`;
    const canonTag = (html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i) || [])[0];
    const link = (canonTag && attr(canonTag, 'href')) || SITE + path;
    const title = decode((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || slug)
      .replace(/\s+/g, ' ').replace(/\s*\|\s*(Evaw Pet|이바우펫)[^|]*$/, '').trim();
    const description = metaContent(html, 'name', 'description');
    let pub = metaContent(html, 'property', 'article:published_time');
    if (!pub) {
      for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
        try { const d = JSON.stringify(JSON.parse(m[1])).match(/"datePublished":"([^"]+)"/); if (d) { pub = d[1]; break; } } catch { }
      }
    }
    pub = pub || lastmod[path] || gitAddedDate(file) || new Date().toISOString();
    const date = /T/.test(pub) ? new Date(pub) : new Date(pub + 'T09:00:00+09:00');
    if (isNaN(date)) continue;
    items.push({ title, link, description, category, date });
  }
}
items.sort((a, b) => b.date - a.date || a.link.localeCompare(b.link));

const rfc822 = (d) => {
  const k = new Date(d.getTime() + 9 * 3600e3);
  const D = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const p = (n) => String(n).padStart(2, '0');
  return `${D[k.getUTCDay()]}, ${p(k.getUTCDate())} ${M[k.getUTCMonth()]} ${k.getUTCFullYear()} ${p(k.getUTCHours())}:${p(k.getUTCMinutes())}:${p(k.getUTCSeconds())} +0900`;
};

let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n'
  + '  <title>이바우펫 애견미용학원</title>\n'
  + `  <link>${SITE}/</link>\n`
  + '  <description>이바우펫 애견미용학원의 새소식, 지역별 안내, 애견미용 가이드, 수강생 사례</description>\n'
  + '  <language>ko</language>\n'
  + `  <lastBuildDate>${rfc822(items.length ? items[0].date : new Date())}</lastBuildDate>\n`
  + `  <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />\n`;
for (const it of items) {
  xml += '  <item>\n'
    + `    <title>${esc(it.title)}</title>\n`
    + `    <link>${esc(it.link)}</link>\n`
    + `    <guid isPermaLink="true">${esc(it.link)}</guid>\n`
    + `    <description>${esc(it.description)}</description>\n`
    + `    <category>${esc(it.category)}</category>\n`
    + `    <pubDate>${rfc822(it.date)}</pubDate>\n`
    + '  </item>\n';
}
xml += '</channel>\n</rss>\n';

const out = join(ROOT, 'rss.xml');
const prev = existsSync(out) ? readFileSync(out, 'utf8') : '';
if (prev === xml) {
  console.log(`rss.xml 변경 없음 (${items.length}개 글)`);
} else {
  writeFileSync(out, xml);
  console.log(`rss.xml 갱신 완료 (${items.length}개 글)`);
}
