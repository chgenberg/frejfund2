import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/admin/boost - manually boost an Investor match ranking
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { investorId, ranking } = body;
    if (!investorId || typeof ranking !== 'number') {
      return NextResponse.json({ error: 'investorId and ranking required' }, { status: 400 });
    }
    const updated = await prisma.investor.update({ where: { id: investorId }, data: { ranking } });
    return NextResponse.json({ success: true, investor: updated });
  } catch (error: any) {
    console.error('Admin boost error:', error);
    return NextResponse.json({ error: 'Failed to boost', details: error.message }, { status: 500 });
  }
}


