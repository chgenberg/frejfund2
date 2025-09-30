import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/profile/share - Toggle profile sharing with VCs
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      email, 
      isPublic, 
      oneLiner, 
      askAmount, 
      traction,
      pitchDeck 
    } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate slug if making public and doesn't have one
    let profileSlug = user.profileSlug;
    if (isPublic && !profileSlug) {
      // Generate from company name or random
      const baseSlug = user.company
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || `founder-${Date.now()}`;
      
      profileSlug = baseSlug;
      
      // Ensure uniqueness
      let counter = 1;
      while (await prisma.user.findUnique({ where: { profileSlug } })) {
        profileSlug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // Update user
    const updated = await prisma.user.update({
      where: { email },
      data: {
        isProfilePublic: isPublic,
        profileSlug: isPublic ? profileSlug : user.profileSlug,
        oneLiner,
        askAmount,
        traction,
        pitchDeck
      }
    });

    const profileUrl = isPublic 
      ? `https://frejfund2-production.up.railway.app/founder/${profileSlug}`
      : null;

    return NextResponse.json({
      success: true,
      isPublic: updated.isProfilePublic,
      profileUrl,
      profileSlug: updated.profileSlug
    });
  } catch (error: any) {
    console.error('Error updating profile sharing:', error);
    return NextResponse.json({ 
      error: 'Failed to update profile',
      details: error.message 
    }, { status: 500 });
  }
}
