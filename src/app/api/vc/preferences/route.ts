import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/vc/preferences - fetch VC preferences by email
export async function GET(req: NextRequest) {
  try {
    const vcEmail = req.headers.get('x-vc-email') || req.nextUrl.searchParams.get('email');
    if (!vcEmail) return NextResponse.json({ error: 'VC email required' }, { status: 400 });

    const prefs = await prisma.vCPreference.findUnique({ where: { vcEmail } });
    return NextResponse.json({ success: true, preferences: prefs });
  } catch (error: any) {
    console.error('GET /api/vc/preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to load preferences', details: error.message },
      { status: 500 },
    );
  }
}

// POST /api/vc/preferences - upsert VC preferences
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      vcEmail,
      vcFirm,
      stages,
      industries,
      geographies,
      checkSizeMin,
      checkSizeMax,
      dealCriteria,
    } = body || {};
    if (!vcEmail) return NextResponse.json({ error: 'vcEmail is required' }, { status: 400 });

    const prefs = await prisma.vCPreference.upsert({
      where: { vcEmail },
      create: {
        vcEmail,
        vcFirm: vcFirm || null,
        stages: Array.isArray(stages) ? stages : [],
        industries: Array.isArray(industries) ? industries : [],
        geographies: Array.isArray(geographies) ? geographies : [],
        checkSizeMin: typeof checkSizeMin === 'number' ? BigInt(checkSizeMin) : null,
        checkSizeMax: typeof checkSizeMax === 'number' ? BigInt(checkSizeMax) : null,
        dealCriteria: dealCriteria || null,
      },
      update: {
        vcFirm: vcFirm || null,
        stages: Array.isArray(stages) ? stages : undefined,
        industries: Array.isArray(industries) ? industries : undefined,
        geographies: Array.isArray(geographies) ? geographies : undefined,
        checkSizeMin: typeof checkSizeMin === 'number' ? BigInt(checkSizeMin) : undefined,
        checkSizeMax: typeof checkSizeMax === 'number' ? BigInt(checkSizeMax) : undefined,
        dealCriteria: dealCriteria || undefined,
      },
    });

    return NextResponse.json({ success: true, preferences: prefs });
  } catch (error: any) {
    console.error('POST /api/vc/preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to save preferences', details: error.message },
      { status: 500 },
    );
  }
}
