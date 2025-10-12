import '@/lib/polyfills'; // Ensure File exists BEFORE other imports evaluate
import { NextRequest, NextResponse } from 'next/server';
import { scrapeSiteDeep } from '@/lib/web-scraper';
import prisma from '@/lib/prisma';
import { indexContextForSession } from '@/lib/vector-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Async website scraping endpoint
 * Returns immediately and processes scraping in background
 */
export async function POST(req: NextRequest) {
  try {
    const { url, sessionId, userId } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 });
    }

    // Return immediately
    const response = NextResponse.json({ 
      ok: true, 
      message: 'Scraping started in background',
      sessionId 
    });

    // Start background processing (non-blocking)
    setImmediate(async () => {
      try {
        console.log(`[Background Scrape] Starting for ${url}`);
        
        // Scrape website (deep scrape but constrained)
        const maxPages = Math.min(5, Number(process.env.SCRAPE_MAX_PAGES || 5));
        const result = await scrapeSiteDeep(url, maxPages, 1);
        
        if (!result?.combinedText) {
          console.error(`[Background Scrape] No text extracted from ${url}`);
          return;
        }

        // Create or find session
        let session;
        if (sessionId) {
          session = await prisma.session.upsert({
            where: { id: sessionId },
            update: {},
            create: { 
              id: sessionId,
              userId: userId || undefined,
              businessInfo: { website: url }
            }
          });
        } else {
          session = await prisma.session.create({
            data: {
              userId: userId || undefined,
              businessInfo: { website: url }
            }
          });
        }

        // Use vector-store's indexing (handles chunking and embeddings)
        const chunksIndexed = await indexContextForSession(
          session.id, 
          result.combinedText, 
          { url }
        );

        console.log(`[Background Scrape] Completed for ${url}: ${chunksIndexed} chunks indexed`);
      } catch (error) {
        console.error('[Background Scrape] Error:', error);
      }
    });

    return response;
  } catch (error) {
    console.error('Async scrape API error:', error);
    return NextResponse.json({ error: 'Failed to start scraping' }, { status: 500 });
  }
}
