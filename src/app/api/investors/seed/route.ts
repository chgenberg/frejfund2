import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { INVESTOR_SEED_DATA } from '@/lib/investor-data';

export const dynamic = 'force-dynamic';

// POST /api/investors/seed - Seed database with investor data
export async function POST(req: NextRequest) {
  try {
    // Check if investors already exist
    const count = await prisma.investor.count();
    
    if (count > 0) {
      return NextResponse.json({ 
        message: 'Investors already seeded', 
        count 
      }, { status: 200 });
    }

    // Seed investors
    const created = await prisma.investor.createMany({
      data: INVESTOR_SEED_DATA
    });

    return NextResponse.json({ 
      message: 'Investors seeded successfully', 
      count: created.count 
    }, { status: 201 });
  } catch (error) {
    console.error('Error seeding investors:', error);
    return NextResponse.json({ error: 'Failed to seed investors' }, { status: 500 });
  }
}
