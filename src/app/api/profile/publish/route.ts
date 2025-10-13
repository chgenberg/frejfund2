import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, isPublic } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Get user from session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { 
        userId: true,
        businessInfo: true
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Create or update user profile
    const businessInfo = session.businessInfo as any || {};
    
    if (session.userId) {
      // Update existing user
      const user = await prisma.user.update({
        where: { id: session.userId },
        data: {
          isProfilePublic: isPublic,
          name: businessInfo.founderName,
          company: businessInfo.name,
          industry: businessInfo.industry,
          stage: businessInfo.stage,
          website: businessInfo.website,
          oneLiner: businessInfo.description,
          askAmount: businessInfo.seeking
        }
      });

      return NextResponse.json({ 
        success: true, 
        isPublic,
        userId: user.id 
      });
    } else {
      // Create new user
      const user = await prisma.user.create({
        data: {
          email: businessInfo.email || `${sessionId}@frejfund.com`,
          name: businessInfo.founderName,
          company: businessInfo.name,
          industry: businessInfo.industry,
          stage: businessInfo.stage,
          website: businessInfo.website,
          oneLiner: businessInfo.description,
          askAmount: businessInfo.seeking,
          isProfilePublic: isPublic
        }
      });

      // Link session to user
      await prisma.session.update({
        where: { id: sessionId },
        data: { userId: user.id }
      });

      return NextResponse.json({ 
        success: true, 
        isPublic,
        userId: user.id 
      });
    }

  } catch (error) {
    console.error('Error publishing profile:', error);
    return NextResponse.json(
      { error: 'Failed to publish profile' },
      { status: 500 }
    );
  }
}
