import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, updates } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Get session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { userId: true, businessInfo: true }
    });

    if (!session || !session.userId) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate and sanitize updates
    const allowedFields = ['name', 'company', 'industry', 'stage', 'website', 'oneLiner', 'askAmount', 'logo'];
    const sanitizedUpdates: any = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        sanitizedUpdates[key] = value;
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: session.userId },
      data: sanitizedUpdates
    });

    // Also update businessInfo in session if relevant fields changed
    if (updates.name || updates.company || updates.industry) {
      const currentBusinessInfo = session.businessInfo as any || {};
      const updatedBusinessInfo = {
        ...currentBusinessInfo,
        ...(updates.name && { founderName: updates.name }),
        ...(updates.company && { name: updates.company }),
        ...(updates.industry && { industry: updates.industry }),
        ...(updates.stage && { stage: updates.stage }),
        ...(updates.website && { website: updates.website }),
        ...(updates.askAmount && { seeking: updates.askAmount }),
        ...(updates.logo && { logo: updates.logo })
      };

      await prisma.session.update({
        where: { id: sessionId },
        data: { businessInfo: updatedBusinessInfo }
      });
    }

    return NextResponse.json({ 
      success: true,
      user: {
        name: user.name,
        email: user.email,
        company: user.company,
        industry: user.industry,
        stage: user.stage,
        website: user.website,
        logo: user.logo
      }
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

