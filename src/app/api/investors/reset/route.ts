import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { INVESTOR_SEED_DATA_EN as INVESTOR_SEED_DATA } from '@/lib/investor-data';

export const dynamic = 'force-dynamic';

// POST /api/investors/reset - Clear and reseed investors
export async function POST(req: NextRequest) {
  try {
    console.log('🔄 Resetting investor database...');

    // Delete all existing investors
    const deleted = await prisma.investor.deleteMany();
    console.log(`✅ Deleted ${deleted.count} existing investors`);

    // Seed with all investors
    const created = await prisma.investor.createMany({
      data: INVESTOR_SEED_DATA
    });
    
    console.log(`✅ Created ${created.count} new investors`);

    return NextResponse.json({ 
      success: true,
      message: 'Investors reset and seeded successfully',
      deleted: deleted.count,
      created: created.count
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error resetting investors:', error);
    return NextResponse.json({ 
      error: 'Failed to reset investors',
      details: error.message
    }, { status: 500 });
  }
}
