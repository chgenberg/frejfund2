import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/vc/swipe - Record VC swipe and reveal if 'like'
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vcEmail, vcFirm, sessionId, action, anonymousData } = body;

    if (!vcEmail || !sessionId || !action) {
      return NextResponse.json({ 
        error: 'VC email, session ID, and action required' 
      }, { status: 400 });
    }

    // Find the founder
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const businessInfo = session.businessInfo as any;
    const user = session.user;

    // Save swipe
    const swipe = await prisma.vCSwipe.create({
      data: {
        vcEmail,
        vcFirm,
        founderId: user?.id || sessionId,
        sessionId,
        action,
        anonymousData,
        matchScore: anonymousData?.matchScore,
        aiReasoning: anonymousData?.aiAnalysis,
        isRevealed: action === 'like' || action === 'super_like'
      }
    });

    // If like or super_like, reveal full profile
    if (action === 'like' || action === 'super_like') {
      // Update swipe to mark as revealed
      await prisma.vCSwipe.update({
        where: { id: swipe.id },
        data: {
          isRevealed: true,
          revealedAt: new Date()
        }
      });

      // Create intro request
      await prisma.introRequest.create({
        data: {
          vcEmail,
          vcName: vcEmail.split('@')[0],
          vcFirm,
          founderId: user?.id || sessionId,
          founderName: user?.name || 'Founder',
          founderCompany: user?.company || businessInfo?.name || 'Company',
          matchScore: anonymousData?.matchScore,
          status: 'pending'
        }
      });

      // Return full profile
      return NextResponse.json({
        success: true,
        action: 'revealed',
        fullProfile: {
          name: user?.name,
          email: user?.email,
          company: user?.company || businessInfo?.name,
          website: user?.website || businessInfo?.website,
          industry: businessInfo?.industry,
          stage: businessInfo?.stage,
          profileUrl: user?.profileSlug ? `/founder/${user.profileSlug}` : null
        }
      });
    }

    // If pass, just acknowledge
    return NextResponse.json({
      success: true,
      action: 'passed'
    });
  } catch (error: any) {
    console.error('Error recording swipe:', error);
    return NextResponse.json({ 
      error: 'Failed to record swipe',
      details: error.message
    }, { status: 500 });
  }
}

// GET /api/vc/swipe - Get next profiles for VC to swipe
export async function GET(req: NextRequest) {
  try {
    const vcEmail = req.headers.get('x-vc-email');
    
    if (!vcEmail) {
      return NextResponse.json({ error: 'VC email required' }, { status: 400 });
    }

    // Get all public founder sessions
    const publicSessions = await prisma.session.findMany({
      where: {
        user: {
          isProfilePublic: true
        }
      },
      include: {
        user: true
      },
      take: 50
    });

    // Get VCs already-swiped sessions
    const swipedSessions = await prisma.vCSwipe.findMany({
      where: { vcEmail },
      select: { sessionId: true }
    });

    const swipedSessionIds = new Set(swipedSessions.map(s => s.sessionId));

    // Filter to only unswiped sessions
    const unseenSessions = publicSessions.filter(
      s => !swipedSessionIds.has(s.id)
    );

    // Convert to blind profiles
    const blindProfiles = unseenSessions.map((session, index) => {
      const businessInfo = session.businessInfo as any;
      const user = session.user;

      return {
        id: `anon_${session.id.slice(-8)}`,
        sessionId: session.id,
        industry: businessInfo?.industry || user?.industry || 'Tech',
        stage: businessInfo?.stage || user?.stage || 'Seed',
        oneLiner: user?.oneLiner || businessInfo?.oneLiner || 'Innovative company',
        askAmount: user?.askAmount || 2000000,
        traction: user?.traction || businessInfo?.traction || {},
        matchScore: 85 + Math.floor(Math.random() * 15), // Simplified for now
        aiAnalysis: `Matches your investment thesis. Strong fundamentals in ${businessInfo?.industry}.`,
        readinessScore: businessInfo?.readinessScore || 70,
        founded: businessInfo?.founded,
        geography: businessInfo?.targetMarket || 'Europe'
      };
    });

    return NextResponse.json({ profiles: blindProfiles });
  } catch (error: any) {
    console.error('Error fetching swipe profiles:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch profiles',
      details: error.message
    }, { status: 500 });
  }
}
