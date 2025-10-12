import { NextRequest, NextResponse } from 'next/server';
import '@/lib/polyfills';
import { scrapeUrl, scrapeSiteShallow, scrapeSiteDeep } from '@/lib/web-scraper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { url, maxPages } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    // basic allowlist: only http/https
    try {
      const u = new URL(url);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        return NextResponse.json({ error: 'Only http/https URLs are allowed' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // shallow multi-page scrape (configurable)
    const pagesFromEnv = Number(process.env.SCRAPE_MAX_PAGES || 6);
    let pages = Number(maxPages ?? pagesFromEnv);
    if (!Number.isFinite(pages)) pages = 5;
    pages = Math.max(1, Math.min(20, Math.floor(pages)));
    const useDeep = pages > 6;
    const { combinedText, sources } = useDeep
      ? await scrapeSiteDeep(url, pages, 2)
      : await scrapeSiteShallow(url, pages);
    const text = (combinedText || '').slice(0, 200_000);
    return NextResponse.json({ result: { url, text }, sources });
  } catch (error) {
    console.error('Scrape API Error:', error);
    return NextResponse.json({ error: 'Failed to scrape url' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Scrape API is running' });
}


