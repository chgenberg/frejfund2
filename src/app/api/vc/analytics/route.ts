import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/vc/analytics - Get analytics for a VC
export async function GET(req: NextRequest) {
  try {
    const vcEmail = req.headers.get('x-vc-email');
    
    if (!vcEmail) {
      return NextResponse.json({ error: 'VC email required' }, { status: 400 });
    }

    // Get all swipes
    const swipes = await prisma.vCSwipe.findMany({
      where: { vcEmail }
    });

    const totalSwipes = swipes.length;
    const likes = swipes.filter(s => s.action === 'like' || s.action === 'super_like').length;
    const passes = swipes.filter(s => s.action === 'pass').length;
    const superLikes = swipes.filter(s => s.action === 'super_like').length;
    const revealed = swipes.filter(s => s.isRevealed).length;

    // Get intro requests
    const introRequests = await prisma.introRequest.findMany({
      where: { vcEmail }
    });

    const totalIntros = introRequests.length;
    const accepted = introRequests.filter(r => r.status === 'accepted').length;
    const declined = introRequests.filter(r => r.status === 'declined').length;
    const pending = introRequests.filter(r => r.status === 'pending').length;
    const meetings = introRequests.filter(r => r.meetingScheduled).length;

    // Calculate metrics
    const likeRate = totalSwipes > 0 ? Math.round((likes / totalSwipes) * 100) : 0;
    const acceptanceRate = totalIntros > 0 ? Math.round((accepted / totalIntros) * 100) : 0;
    const meetingRate = accepted > 0 ? Math.round((meetings / accepted) * 100) : 0;

    // Estimate time saved (15 min per profile screened manually)
    const timeSavedMinutes = totalSwipes * 15;
    const timeSavedHours = Math.round(timeSavedMinutes / 60);

    // Estimate value ($500/hour for partner time)
    const valueSaved = timeSavedHours * 500;

    // Get recent activity
    const recentSwipes = swipes.slice(-10).reverse();
    const recentIntros = introRequests.slice(-5).reverse();

    const analytics = {
      overview: {
        totalSwipes,
        likes,
        passes,
        superLikes,
        likeRate: `${likeRate}%`
      },
      intros: {
        total: totalIntros,
        accepted,
        declined,
        pending,
        acceptanceRate: `${acceptanceRate}%`
      },
      meetings: {
        scheduled: meetings,
        meetingRate: `${meetingRate}%`
      },
      efficiency: {
        timeSavedHours,
        valueSaved: `$${valueSaved.toLocaleString()}`,
        avgSwipeTime: '45 seconds',
        vsManualScreening: '15 minutes'
      },
      recent: {
        swipes: recentSwipes.map(s => ({
          action: s.action,
          matchScore: s.matchScore,
          createdAt: s.createdAt
        })),
        intros: recentIntros.map(r => ({
          company: r.founderCompany,
          status: r.status,
          requestedAt: r.requestedAt
        }))
      },
      benchmarks: {
        yourLikeRate: likeRate,
        avgLikeRate: 22,
        yourAcceptanceRate: acceptanceRate,
        avgAcceptanceRate: 45,
        yourMeetingRate: meetingRate,
        avgMeetingRate: 35
      }
    };

    return NextResponse.json({ analytics });
  } catch (error: any) {
    console.error('Error fetching VC analytics:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch analytics',
      details: error.message
    }, { status: 500 });
  }
}
