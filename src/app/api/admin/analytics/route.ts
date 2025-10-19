import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Signups
    const signups = await prisma.user.count();
    // Qualified founders (public profiles)
    const qualified = await prisma.user.count({ where: { isProfilePublic: true } });
    // Matches suggested
    const suggested = await prisma.investorMatch.count();
    // Intro requests
    const intros = await prisma.introRequest.count();
    // Accepts
    const accepted = await prisma.introRequest.count({ where: { status: 'accepted' } });
    // Meetings
    const meetings = await prisma.introRequest.count({ where: { meetingScheduled: true } });

    return NextResponse.json({
      funnel: {
        signups,
        qualified,
        suggested,
        intros,
        accepted,
        meetings,
      },
    });
  } catch (error: any) {
    console.error('Admin analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to load analytics', details: error.message },
      { status: 500 },
    );
  }
}
