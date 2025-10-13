import { NextRequest, NextResponse } from 'next/server';
import { runEnhancedScraping, generateEnrichedSummary } from '@/lib/enhanced-scraper';
import { BusinessInfo } from '@/types/business';

export const maxDuration = 60; // Allow up to 60 seconds for scraping
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const businessInfo: BusinessInfo = await req.json();

    if (!businessInfo.website && !businessInfo.linkedinUrl) {
      return NextResponse.json(
        { error: 'At least website or LinkedIn URL required' },
        { status: 400 }
      );
    }

    // Run enhanced scraping
    const scrapingResult = await runEnhancedScraping(businessInfo);
    
    // Generate enriched summary for GPT
    const enrichedSummary = generateEnrichedSummary(scrapingResult, businessInfo);

    return NextResponse.json({
      success: true,
      result: scrapingResult,
      enrichedSummary,
      stats: {
        dataSources: scrapingResult.dataSources,
        totalDataPoints: scrapingResult.totalDataPoints,
        duration: scrapingResult.scrapingDuration
      }
    });

  } catch (error) {
    console.error('Enhanced scraping error:', error);
    return NextResponse.json(
      { error: 'Failed to complete enhanced scraping', details: String(error) },
      { status: 500 }
    );
  }
}

