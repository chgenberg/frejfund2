import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { normalizeKpis, estimateReadiness, computeVcAffinity, blendMatchScore } from '@/lib/matching-utils';

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

    // If like or super_like, create intro request (but DON'T reveal yet)
    if (action === 'like' || action === 'super_like') {
      // Create intro request (pending founder acceptance)
      const introRequest = await prisma.introRequest.create({
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

      // TODO: Send email notification to founder
      // For now, they'll see it in-app notification bell

      // Return "waiting" status (NOT revealed yet)
      return NextResponse.json({
        success: true,
        action: 'intro_requested',
        message: `Intro request sent to ${businessInfo?.name || 'the founder'}. You'll be notified when they respond.`,
        status: 'pending',
        requestId: introRequest.id
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

// GET /api/vc/swipe - Get next profiles for VC to swipe (with smart matching)
export async function GET(req: NextRequest) {
  try {
    const vcEmail = req.headers.get('x-vc-email');
    
    if (!vcEmail) {
      return NextResponse.json({ error: 'VC email required' }, { status: 400 });
    }

    // Use smart matching if VC has swipe history
    const { getPersonalizedRecommendations } = await import('@/lib/smart-matching');
    
    try {
      const recommendations = await getPersonalizedRecommendations(vcEmail, 20);
      
      if (recommendations.length > 0) {
        // Convert to blind profiles
        const blindProfiles = recommendations.map(rec => ({
          id: `anon_${rec.sessionId.slice(-8)}`,
          sessionId: rec.sessionId,
          industry: rec.profile.industry,
          stage: rec.profile.stage,
          oneLiner: rec.profile.oneLiner || 'Innovative company',
          askAmount: rec.profile.askAmount || 2000000,
          traction: rec.profile.traction || {},
          matchScore: rec.score,
          aiAnalysis: rec.reasoning,
          readinessScore: rec.profile.readinessScore || 70,
          geography: rec.profile.geography || 'Europe'
        }));

        return NextResponse.json({ 
          profiles: blindProfiles,
          personalized: true 
        });
      }
    } catch (error) {
      console.log('Smart matching not available, falling back to basic matching');
    }

    // Load VC preferences if available
    const prefs = await prisma.vCPreference.findUnique({ where: { vcEmail } });

    // Fallback: Basic matching (if smart matching fails)
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

    const swipedSessions = await prisma.vCSwipe.findMany({
      where: { vcEmail },
      select: { sessionId: true }
    });

    const swipedSessionIds = new Set(swipedSessions.map(s => s.sessionId));
    let unseenSessions = publicSessions.filter(s => !swipedSessionIds.has(s.id));

    // Apply VC preferences filtering if present
    if (prefs) {
      unseenSessions = unseenSessions.filter((s) => {
        const bi = s.businessInfo as any;
        const user = s.user as any;
        const stage = String(bi?.stage || user?.stage || '').toLowerCase();
        const industry = String(bi?.industry || user?.industry || '').toLowerCase();
        const geo = String(bi?.targetMarket || 'europe').toLowerCase();
        const ask = Number(user?.askAmount || 0);

        const stageOk = prefs.stages.length === 0 || prefs.stages.some(st => stage.includes(st));
        const industryOk = prefs.industries.length === 0 || prefs.industries.some(ind => industry.includes(ind));
        const geoOk = prefs.geographies.length === 0 || prefs.geographies.some(g => geo.includes(g));
        const checkOk = (!prefs.checkSizeMin && !prefs.checkSizeMax) || (
          (!prefs.checkSizeMin || (ask >= Number(prefs.checkSizeMin))) &&
          (!prefs.checkSizeMax || (ask <= Number(prefs.checkSizeMax)))
        );

        return stageOk && industryOk && geoOk && checkOk;
      });
    }

    // Compute VC affinity weights once
    const affinity = await computeVcAffinity(vcEmail);

    const blindProfiles = await Promise.all(unseenSessions.map(async (session) => {
      const businessInfo = session.businessInfo as any;
      const user = session.user;

      const kpis = normalizeKpis(user?.traction || businessInfo?.traction || {});
      const readiness = estimateReadiness(businessInfo, kpis);

      // Base score (simple heuristic when smart matching unavailable)
      const baseScore = 85 + Math.floor(Math.random() * 15);
      const aff = {
        industry: affinity.industry[String(businessInfo?.industry || user?.industry || '').toLowerCase()] || 1,
        stage: affinity.stage[String(businessInfo?.stage || user?.stage || '').toLowerCase()] || 1,
        geography: affinity.geography[String(businessInfo?.targetMarket || 'europe').toLowerCase()] || 1,
      };
      const finalScore = blendMatchScore({ baseScore, kpiScore: kpis.composite, readinessScore: readiness, affinity: aff });

      return {
        id: `anon_${session.id.slice(-8)}`,
        sessionId: session.id,
        industry: businessInfo?.industry || user?.industry || 'Tech',
        stage: businessInfo?.stage || user?.stage || 'Seed',
        oneLiner: user?.oneLiner || 'Innovative company',
        askAmount: user?.askAmount || 2000000,
        traction: user?.traction || businessInfo?.traction || {},
        matchScore: finalScore,
        aiAnalysis: prefs?.dealCriteria
          ? `Matches your criteria: ${prefs.dealCriteria}. KPI score ${kpis.composite}/100, readiness ${readiness}/100.`
          : `Strong fundamentals. KPI score ${kpis.composite}/100, readiness ${readiness}/100.`,
        readinessScore: readiness,
        geography: businessInfo?.targetMarket || 'Europe'
      };
    }));

    return NextResponse.json({ 
      profiles: blindProfiles,
      personalized: false
    });
  } catch (error: any) {
    console.error('Error fetching swipe profiles:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch profiles',
      details: error.message
    }, { status: 500 });
  }
}
