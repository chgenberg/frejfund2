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

const ROBOTS_CACHE = new Map<string, { fetchedAt: number; rules: Record<string, string[]> }>();

function getUserAgent(): string {
  return process.env.SCRAPER_USER_AGENT || 'FrejFundBot/1.0 (+https://www.frejfund.com/bot)';
}

async function fetchRobots(origin: string): Promise<Record<string, string[]>> {
  const cached = ROBOTS_CACHE.get(origin);
  if (cached && Date.now() - cached.fetchedAt < 1000 * 60 * 60) {
    // 1h
    return cached.rules;
  }
  try {
    const res = await fetch(`${origin}/robots.txt`, {
      headers: { 'User-Agent': getUserAgent() },
      redirect: 'follow',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(String(res.status));
    const text = await res.text();
    const lines = text.split(/\r?\n/);
    const rules: Record<string, string[]> = {};
    let currentUA: string | null = null;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const mUA = trimmed.match(/^User-agent:\s*(.+)/i);
      if (mUA) {
        currentUA = mUA[1].trim().toLowerCase();
        rules[currentUA] = rules[currentUA] || [];
        continue;
      }
      const mDis = trimmed.match(/^Disallow:\s*(.*)/i);
      if (mDis) {
        const path = (mDis[1] || '').trim();
        if (currentUA) {
          rules[currentUA] = rules[currentUA] || [];
          rules[currentUA].push(path);
        }
      }
    }
    ROBOTS_CACHE.set(origin, { fetchedAt: Date.now(), rules });
    return rules;
  } catch {
    const rules: Record<string, string[]> = {};
    ROBOTS_CACHE.set(origin, { fetchedAt: Date.now(), rules });
    return rules;
  }
}

function isPathAllowed(origin: string, path: string, rules: Record<string, string[]>): boolean {
  const ua = getUserAgent().toLowerCase();
  const agent =
    (Object.keys(rules).find((k: string) => ua.includes(k)) as string | undefined) || '*';
  const disallows = (rules[agent] || []).concat(rules['*'] || []);
  if (disallows.length === 0) return true;
  for (const rule of disallows) {
    if (!rule) continue;
    if (rule === '/') return false;
    if (path.startsWith(rule)) return false;
  }
  return true;
}

export async function fetchHtml(url: string, timeoutMs = 12000): Promise<string> {
  // Prefer https if http was provided
  const tryUrls = [url.startsWith('http://') ? url.replace('http://', 'https://') : url, url];
  const headers = {
    'User-Agent': getUserAgent(),
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,sv;q=0.8',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    'Upgrade-Insecure-Requests': '1',
  } as Record<string, string>;

  for (const u of tryUrls) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        // robots.txt respect (best-effort)
        try {
          const origin = new URL(u).origin;
          const path = new URL(u).pathname;
          const rules = await fetchRobots(origin);
          if (!isPathAllowed(origin, path, rules)) {
            console.log(`[Scraper] Blocked by robots.txt: ${u}`);
            clearTimeout(timer);
            continue;
          }
        } catch {}
        const res = await fetch(u, { headers, redirect: 'follow', signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();
        if (html && html.length > 0) return html;
      } catch (e) {
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
      } finally {
        clearTimeout(timer);
      }
    }
  }
  return '';
}

export async function extractMainContentWithReadability(
  url: string,
  html: string,
): Promise<ScrapeResult | null> {
  try {
    // Guard: skip heavy Readability on very large pages to avoid OOM
    if (!html || html.trim().length === 0) {
      console.log(`[Scraper] Empty HTML for ${url} - will use Cheerio fallback`);
      return null;
    }

    if (html.length > 300_000) {
      console.log(
        `[Scraper] HTML too large (${(html.length / 1000).toFixed(0)}KB) for ${url} - using Cheerio instead`,
      );
      return null;
    }
    // Lazy-require to avoid bundler resolving at build time
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { JSDOM } = require('jsdom');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Readability } = require('@mozilla/readability');

    // Create DOM with resource limits
    let dom;
    try {
      dom = new JSDOM(html, {
        url,
        resources: 'usable',
        runScripts: 'outside-only',
        pretendToBeVisual: false,
        includeNodeLocations: false,
      });
    } catch (domError: any) {
      console.log(
        `[Scraper] JSDOM failed for ${url}: ${domError?.message || 'Unknown error'} - using Cheerio`,
      );
      return null;
    }

    // Verify document exists
    if (!dom?.window?.document) {
      console.log(`[Scraper] JSDOM document not available for ${url} - using Cheerio`);
      try {
        dom?.window?.close();
      } catch (e) {
        /* ignore */
      }
      return null;
    }

    let article = null;
    try {
      const reader = new Readability(dom.window.document);
      article = reader.parse();

      if (!article || !article.textContent || article.textContent.length < 100) {
        console.log(
          `[Scraper] Readability extracted too little content from ${url} (${article?.textContent?.length || 0} chars) - using Cheerio`,
        );
        try {
          dom.window.close();
        } catch (e) {
          /* ignore */
        }
        return null;
      }

      console.log(
        `[Scraper] ✓ Readability extracted ${article.textContent.length} chars from ${url}`,
      );
    } catch (readabilityError: any) {
      console.log(
        `[Scraper] Readability parsing failed for ${url}: ${readabilityError?.message || 'Unknown'} - using Cheerio`,
      );
      try {
        dom.window.close();
      } catch (e) {
        /* ignore */
      }
      return null;
    }

    // Clean up DOM to free memory
    try {
      dom.window.close();
    } catch (e) {
      // Ignore close errors
    }

    if (!article || !article.textContent) return null;
    const text = normalizeWhitespace(article.textContent).slice(0, 50000); // Limit text to 50k chars
    return { url, title: article.title || undefined, text };
  } catch (error: any) {
    // Quieter logging: one-line fallback only
    console.log(
      `[Scraper] Readability extraction failed: ${error?.message || 'Unknown'} – using Cheerio`,
    );
    return null;
  }
}

export async function extractWithCheerio(url: string, html: string): Promise<ScrapeResult> {
  const $ = cheerio.load(html);
  const title = $('title').first().text() || undefined;
  // Remove scripts/styles/nav/footers for less noise
  ['script', 'style', 'noscript', 'nav', 'footer', 'form'].forEach((sel) => $(sel).remove());
  // Guard extremely large body text to avoid heap pressure
  const bodyText = normalizeWhitespace(($('body').text() || '').slice(0, 400_000));
  const meta: Record<string, string> = {};
  $('meta').each((_, el) => {
    const name = $(el).attr('name') || $(el).attr('property');
    const content = $(el).attr('content');
    if (name && content) meta[name] = content;
  });

  console.log(`[Scraper] ✓ Cheerio extracted ${bodyText.length} chars from ${url}`);
  return { url, title, text: bodyText, meta };
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  // cache
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < DEFAULT_TTL_MS) {
    return { url, text: hit.text };
  }

  const html = await fetchHtml(url);
  // Hard clamp HTML to avoid large DOM parsing
  const safeHtml = html.length > 400_000 ? html.slice(0, 400_000) : html;
  const readability = await extractMainContentWithReadability(url, safeHtml);
  if (readability && readability.text && readability.text.length > 200) {
    cache.set(url, { text: readability.text, at: Date.now() });
    return readability;
  }
  const basic = await extractWithCheerio(url, safeHtml);
  cache.set(url, { text: basic.text, at: Date.now() });
  return basic;
}

export async function scrapeSiteShallow(
  startUrl: string,
  maxPages = 5,
): Promise<{ combinedText: string; sources: { url: string; snippet: string }[] }> {
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
      const safeHtml = html.length > 350_000 ? html.slice(0, 350_000) : html;
      // Extract text once per page
      const readability = await extractMainContentWithReadability(url, safeHtml);
      const pageText = readability?.text || (await extractWithCheerio(url, safeHtml)).text;
      if (pageText) {
        combined.push(pageText);
        sources.push({ url, snippet: pageText.slice(0, 200) });
      }
      // discover links (same-origin only) from the same HTML
      const $ = cheerio.load(safeHtml);
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href') || '';
        try {
          const link = new URL(href, url);
          if (
            link.origin === origin &&
            !visited.has(link.href) &&
            queue.length + visited.size < maxPages
          ) {
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

export async function scrapeSiteDeep(
  startUrl: string,
  maxPages = parseInt(process.env.SCRAPE_MAX_PAGES || '50'),
  maxDepth = parseInt(process.env.SCRAPE_MAX_DEPTH || '2'),
): Promise<{ combinedText: string; sources: { url: string; snippet: string }[] }> {
  const u = new URL(startUrl);
  const origin = u.origin;
  const visited = new Set<string>();
  const queue: Array<{ url: string; depth: number }> = [{ url: startUrl, depth: 0 }];
  const sources: { url: string; snippet: string }[] = [];
  const combined: string[] = [];

  // Try to seed from sitemap.xml if available
  try {
    const sm = await fetchHtml(`${origin}/sitemap.xml`, 5000);
    const locs = Array.from(sm.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi))
      .map((m) => m[1])
      .slice(0, 20);
    locs.forEach((href) => {
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
      const safeHtml = html.length > 350_000 ? html.slice(0, 350_000) : html;
      const readability = await extractMainContentWithReadability(url, safeHtml);
      const pageText = readability?.text || (await extractWithCheerio(url, safeHtml)).text;
      if (pageText) {
        combined.push(pageText);
        sources.push({ url, snippet: pageText.slice(0, 200) });
      }

      if (depth < maxDepth) {
        const $ = cheerio.load(safeHtml);
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
          .forEach((c) => queue.push({ url: c.href, depth: depth + 1 }));
      }
    } catch {}
  }

  return { combinedText: combined.join('\n\n'), sources };
}
