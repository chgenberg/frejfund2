import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/investors/debug - Debug investor seeding
export async function GET(req: NextRequest) {
  try {
    // Check if we can import the data
    let dataImported = false;
    let dataCount = 0;
    let sampleInvestor = null;
    let importError = null;

    try {
      const { INVESTOR_SEED_DATA_EN } = await import('@/lib/investor-data');
      dataImported = true;
      dataCount = INVESTOR_SEED_DATA_EN.length;
      sampleInvestor = INVESTOR_SEED_DATA_EN[0];
    } catch (e: any) {
      importError = e.message;
    }

    // Check database connection
    let dbConnected = false;
    let existingCount = 0;
    let dbError = null;

    try {
      existingCount = await prisma.investor.count();
      dbConnected = true;
    } catch (e: any) {
      dbError = e.message;
    }

    // Try to create one investor manually
    let testCreateError = null;

    if (dataImported && sampleInvestor && dbConnected) {
      try {
        await prisma.investor.create({
          data: {
            name: sampleInvestor.name || 'Test',
            firmName: sampleInvestor.firmName || 'Test Firm',
            type: sampleInvestor.type || 'vc',
            stage: sampleInvestor.stage || ['seed'],
            industries: sampleInvestor.industries || ['saas'],
            geographies: sampleInvestor.geographies || ['europe'],
            notableInvestments: sampleInvestor.notableInvestments || [],
            tags: sampleInvestor.tags || [],
            portfolioCount: sampleInvestor.portfolioCount || 0,
            checkSizeMin: sampleInvestor.checkSizeMin,
            checkSizeMax: sampleInvestor.checkSizeMax,
            fundSize: sampleInvestor.fundSize,
            yearFounded: sampleInvestor.yearFounded,
            dealsPerYear: sampleInvestor.dealsPerYear,
            thesis: sampleInvestor.thesis,
            sweetSpot: sampleInvestor.sweetSpot,
            ranking: sampleInvestor.ranking,
            website: sampleInvestor.website,
            linkedIn: sampleInvestor.linkedIn,
            twitter: sampleInvestor.twitter,
            email: sampleInvestor.email,
          },
        });
      } catch (e: any) {
        testCreateError = e.message;
      }
    }

    return NextResponse.json({
      dataImport: {
        success: dataImported,
        count: dataCount,
        error: importError,
        sample: sampleInvestor
          ? {
              name: sampleInvestor.name,
              firmName: sampleInvestor.firmName,
              hasAllFields: !!(sampleInvestor.stage && sampleInvestor.industries),
            }
          : null,
      },
      database: {
        connected: dbConnected,
        existingInvestors: existingCount,
        error: dbError,
      },
      testCreate: {
        error: testCreateError,
        success: !testCreateError,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Debug failed',
        details: error.message,
      },
      { status: 500 },
    );
  }
}
