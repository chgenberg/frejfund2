import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/founder/[slug] - Get public founder profile
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    // Find user by profile slug
    const user = await prisma.user.findUnique({
      where: { profileSlug: slug }
    });

    if (!user || !user.isProfilePublic) {
      return NextResponse.json({ error: 'Profile not found or private' }, { status: 404 });
    }

    // Get most recent session for business info
    const session = await prisma.session.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' }
    });

    const businessInfo = session?.businessInfo as any;

    const profile = {
      name: user.name,
      email: user.email,
      company: user.company || businessInfo?.name,
      industry: user.industry || businessInfo?.industry,
      stage: user.stage || businessInfo?.stage,
      website: user.website || businessInfo?.website,
      oneLiner: user.oneLiner,
      askAmount: user.askAmount,
      traction: user.traction,
      pitchDeck: user.pitchDeck,
      readinessScore: businessInfo?.readinessScore
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error fetching founder profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
