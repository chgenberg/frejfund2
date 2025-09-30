import { NextRequest, NextResponse } from 'next/server';
import { scrapeWebsite } from '@/lib/web-scraper';
import prisma from '@/lib/prisma';
import { embedTexts } from '@/lib/vector-store';

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
        
        // Scrape website
        const result = await scrapeWebsite(url, { deep: true, maxPages: 5 });
        
        if (!result?.text) {
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

        // Chunk text into smaller pieces
        const chunkSize = 1000;
        const chunks: string[] = [];
        for (let i = 0; i < result.text.length; i += chunkSize) {
          chunks.push(result.text.substring(i, i + chunkSize));
        }

        // Generate embeddings for chunks
        const embeddings = await embedTexts(chunks);

        // Store in database
        const documents = await Promise.all(
          chunks.map((chunk, i) => 
            prisma.document.create({
              data: {
                sessionId: session.id,
                content: chunk,
                embedding: embeddings[i] || null,
                metadata: {
                  source: 'website',
                  url: url,
                  chunkIndex: i,
                  totalChunks: chunks.length,
                  scrapedAt: new Date().toISOString()
                }
              }
            })
          )
        );

        console.log(`[Background Scrape] Completed for ${url}: ${documents.length} chunks saved`);
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
