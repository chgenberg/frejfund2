import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/admin/stats - Get platform success metrics
export async function GET(req: NextRequest) {
  try {
    // Get all counts
    const totalFounders = await prisma.user.count();
    const publicProfiles = await prisma.user.count({
      where: { isProfilePublic: true }
    });

    const totalSessions = await prisma.session.count();
    
    const totalSwipes = await prisma.vCSwipe.count();
    const totalLikes = await prisma.vCSwipe.count({
      where: {
        action: { in: ['like', 'super_like'] }
      }
    });

    // Get unique VCs
    const uniqueVCs = await prisma.vCSwipe.groupBy({
      by: ['vcEmail']
    });
    const totalVCs = uniqueVCs.length;

    // Get active VCs (swiped in last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const activeVCs = await prisma.vCSwipe.groupBy({
      by: ['vcEmail'],
      where: {
        createdAt: { gte: oneWeekAgo }
      }
    });

    // Swipes this week
    const swipesThisWeek = await prisma.vCSwipe.count({
      where: {
        createdAt: { gte: oneWeekAgo }
      }
    });

    // Intro requests
    const totalIntros = await prisma.introRequest.count();
    const acceptedIntros = await prisma.introRequest.count({
      where: { status: 'accepted' }
    });
    const meetingsScheduled = await prisma.introRequest.count({
      where: { meetingScheduled: true }
    });

    // Calculate revenue potential
    const avgRevenuePerVC = 5000; // $5k/month average
    const mrr = totalVCs * avgRevenuePerVC;
    const arr = mrr * 12;

    // Platform health metrics
    const avgSwipesPerVC = totalVCs > 0 ? Math.round(totalSwipes / totalVCs) : 0;
    
    const stats = {
      // Core metrics
      totalFounders,
      publicProfiles,
      totalSessions,
      totalVCs,
      activeVCs: activeVCs.length,
      
      // Engagement
      totalSwipes,
      totalLikes,
      swipesThisWeek,
      
      // Conversions
      totalIntros,
      acceptedIntros,
      meetingsScheduled,
      
      // Revenue
      mrr,
      arr,
      
      // Health
      avgSwipesPerVC,
      avgProfileCompletion: Math.round((publicProfiles / totalFounders) * 100),
      dailyActiveUsers: activeVCs.length, // Simplified
      
      // Rates
      likeRate: totalSwipes > 0 ? Math.round((totalLikes / totalSwipes) * 100) : 0,
      acceptanceRate: totalIntros > 0 ? Math.round((acceptedIntros / totalIntros) * 100) : 0,
      meetingRate: acceptedIntros > 0 ? Math.round((meetingsScheduled / acceptedIntros) * 100) : 0
    };

    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch stats',
      details: error.message
    }, { status: 500 });
  }
}
