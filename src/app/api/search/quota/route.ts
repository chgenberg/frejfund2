import { NextRequest, NextResponse } from 'next/server';
import { getUserSearchQuota } from '@/lib/google-search';

export const dynamic = 'force-dynamic';

/**
 * GET /api/search/quota?userId=xxx
 * Get user's remaining Google Search quota
 */
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const quota = await getUserSearchQuota(userId);

    return NextResponse.json(quota);
  } catch (error) {
    console.error('Error fetching search quota:', error);
    return NextResponse.json({ error: 'Failed to fetch quota' }, { status: 500 });
  }
}

