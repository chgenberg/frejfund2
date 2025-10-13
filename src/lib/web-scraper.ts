import * as cheerio from 'cheerio';

export interface ScrapeResult {
  url: string;
  title?: string;
  text: string;
  meta?: Record<string, string>;
}

const cache = new Map<string, { text: string; at: number }>();
const DEFAULT_TTL_MS = 1000 * 60 * 30; // 30 minutes

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\u00A0/g, ' ')
    .replace(/[\t ]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}

export async function fetchHtml(url: string, timeoutMs = 12000): Promise<string> {
  // Prefer https if http was provided
  const tryUrls = [url.startsWith('http://') ? url.replace('http://', 'https://') : url, url];
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,sv;q=0.8',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Upgrade-Insecure-Requests': '1'
  } as Record<string, string>;

  for (const u of tryUrls) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(u, { headers, redirect: 'follow', signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();
        if (html && html.length > 0) return html;
      } catch (e) {
        await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
      } finally {
        clearTimeout(timer);
      }
    }
  }
  return '';
}

export async function extractMainContentWithReadability(url: string, html: string): Promise<ScrapeResult | null> {
  try {
    // Guard: skip heavy Readability on very large pages to avoid OOM
    if (!html || html.length > 300_000) { // Reduced from 600K to 300K
      return null;
    }
    // Lazy-require to avoid bundler resolving at build time
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { JSDOM } = require('jsdom');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Readability } = require('@mozilla/readability');
    
    // Create DOM with resource limits
    const dom = new JSDOM(html, { 
      url,
      resources: 'usable',
      runScripts: 'outside-only',
      pretendToBeVisual: false,
      includeNodeLocations: false
    });
    
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    
    // Clean up DOM to free memory
    dom.window.close();
    
    if (!article) return null;
    const text = normalizeWhitespace(article.textContent || '').slice(0, 50000); // Limit text to 50k chars
    return { url, title: article.title || undefined, text };
  } catch (error) {
    console.error('Readability extraction failed:', error);
    return null;
  }
}

export async function extractWithCheerio(url: string, html: string): Promise<ScrapeResult> {
  const $ = cheerio.load(html);
  const title = $('title').first().text() || undefined;
  // Remove scripts/styles/nav/footers for less noise
  ['script', 'style', 'noscript', 'nav', 'footer', 'form'].forEach((sel) => $(sel).remove());
  const bodyText = normalizeWhitespace($('body').text() || '');
  const meta: Record<string, string> = {};
  $('meta').each((_, el) => {
    const name = $(el).attr('name') || $(el).attr('property');
    const content = $(el).attr('content');
    if (name && content) meta[name] = content;
  });
  return { url, title, text: bodyText, meta };
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  // cache
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < DEFAULT_TTL_MS) {
    return { url, text: hit.text };
  }

  const html = await fetchHtml(url);
  const readability = await extractMainContentWithReadability(url, html);
  if (readability && readability.text && readability.text.length > 200) {
    cache.set(url, { text: readability.text, at: Date.now() });
    return readability;
  }
  const basic = await extractWithCheerio(url, html);
  cache.set(url, { text: basic.text, at: Date.now() });
  return basic;
}

export async function scrapeSiteShallow(startUrl: string, maxPages = 5): Promise<{ combinedText: string; sources: { url: string; snippet: string }[] }> {
  const u = new URL(startUrl);
  const origin = u.origin;
  const visited = new Set<string>();
  const queue: string[] = [startUrl];
  const sources: { url: string; snippet: string }[] = [];
  let combined: string[] = [];

  while (queue.length && visited.size < maxPages) {
    const url = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);
    try {
      const html = await fetchHtml(url);
      // Extract text once per page
      const readability = await extractMainContentWithReadability(url, html);
      const pageText = readability?.text || (await extractWithCheerio(url, html)).text;
      if (pageText) {
        combined.push(pageText);
        sources.push({ url, snippet: pageText.slice(0, 200) });
      }
      // discover links (same-origin only) from the same HTML
      const $ = cheerio.load(html);
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href') || '';
        try {
          const link = new URL(href, url);
          if (link.origin === origin && !visited.has(link.href) && queue.length + visited.size < maxPages) {
            // pick likely relevant pages
            if (/about|pricing|product|solutions|case|blog/i.test(link.pathname)) {
              queue.push(link.href);
            }
          }
        } catch {}
      });
    } catch {}
  }

  return { combinedText: combined.join('\n\n'), sources };
}

function relevanceScore(pathname: string): number {
  const p = pathname.toLowerCase();
  let score = 0;
  if (/about|team|company/.test(p)) score += 5;
  if (/pricing|plans/.test(p)) score += 6;
  if (/product|solution|platform|features/.test(p)) score += 7;
  if (/case|customer|reference|success/.test(p)) score += 7;
  if (/blog|news|press|insights|articles/.test(p)) score += 3;
  if (/contact|careers|legal|privacy|terms/.test(p)) score += 1;
  if (p === '/' || p === '') score += 8;
  return score;
}

export async function scrapeSiteDeep(startUrl: string, maxPages = 20, maxDepth = 2): Promise<{ combinedText: string; sources: { url: string; snippet: string }[] }> {
  const u = new URL(startUrl);
  const origin = u.origin;
  const visited = new Set<string>();
  const queue: Array<{ url: string; depth: number }> = [{ url: startUrl, depth: 0 }];
  const sources: { url: string; snippet: string }[] = [];
  const combined: string[] = [];

  // Try to seed from sitemap.xml if available
  try {
    const sm = await fetchHtml(`${origin}/sitemap.xml`, 5000);
    const locs = Array.from(sm.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)).map(m => m[1]).slice(0, 20);
    locs.forEach(href => {
      try {
        const link = new URL(href);
        if (link.origin === origin) queue.push({ url: link.href, depth: 0 });
      } catch {}
    });
  } catch {}

  while (queue.length && visited.size < maxPages) {
    const { url, depth } = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);
    try {
      const html = await fetchHtml(url);
      const readability = await extractMainContentWithReadability(url, html);
      const pageText = readability?.text || (await extractWithCheerio(url, html)).text;
      if (pageText) {
        combined.push(pageText);
        sources.push({ url, snippet: pageText.slice(0, 200) });
      }

      if (depth < maxDepth) {
        const $ = cheerio.load(html);
        const candidates: Array<{ href: string; score: number }> = [];
        $('a[href]').each((_, el) => {
          const href = $(el).attr('href') || '';
          try {
            const link = new URL(href, url);
            if (link.origin !== origin) return;
            const s = relevanceScore(link.pathname);
            if (s <= 0) return;
            if (!visited.has(link.href)) candidates.push({ href: link.href, score: s });
          } catch {}
        });
        candidates
          .sort((a, b) => b.score - a.score)
          .slice(0, Math.max(0, maxPages - visited.size))
          .forEach(c => queue.push({ url: c.href, depth: depth + 1 }));
      }
    } catch {}
  }

  return { combinedText: combined.join('\n\n'), sources };
}


