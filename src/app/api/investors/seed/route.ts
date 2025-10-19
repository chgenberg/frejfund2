import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { INVESTOR_SEED_DATA_EN as INVESTOR_SEED_DATA } from '@/lib/investor-data';

export const dynamic = 'force-dynamic';

// POST /api/investors/seed - Seed database with investor data
export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const force = url.searchParams.get('force') === 'true';

    // Check if investors already exist
    const count = await prisma.investor.count();

    if (count > 0 && !force) {
      return NextResponse.json(
        {
          message: 'Investors already seeded (use ?force=true to reseed)',
          count,
        },
        { status: 200 },
      );
    }

    // If forcing, delete existing first
    if (force && count > 0) {
      const deleted = await prisma.investor.deleteMany();
      console.log(`Deleted ${deleted.count} existing investors`);
    }

    // Seed investors
    const created = await prisma.investor.createMany({
      data: INVESTOR_SEED_DATA,
    });

    return NextResponse.json(
      {
        message: 'Investors seeded successfully',
        count: created.count,
        totalInDatabase: created.count,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('Error seeding investors:', error);
    return NextResponse.json(
      {
        error: 'Failed to seed investors',
        details: error.message,
        stack: error.stack?.split('\n').slice(0, 3),
      },
      { status: 500 },
    );
  }
}
