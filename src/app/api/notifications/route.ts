import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/notifications - Get notifications for a session
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.headers.get('x-session-id');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Get pending intro requests for this founder
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true }
    });

    if (!session || !session.user) {
      return NextResponse.json({ notifications: [] });
    }

    const introRequests = await prisma.introRequest.findMany({
      where: {
        founderId: session.user.id,
        status: 'pending'
      },
      orderBy: { requestedAt: 'desc' }
    });

    const notifications = introRequests.map(req => ({
      id: req.id,
      type: 'intro_request',
      vcName: req.vcName,
      vcFirm: req.vcFirm,
      vcEmail: req.vcEmail,
      matchScore: req.matchScore,
      requestedAt: req.requestedAt,
      message: `${req.vcFirm} is interested in meeting you!`
    }));

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// POST /api/notifications/respond - Respond to intro request
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, response, message } = body;

    if (!requestId || !response) {
      return NextResponse.json({ 
        error: 'Request ID and response required' 
      }, { status: 400 });
    }

    // Update intro request
    const updated = await prisma.introRequest.update({
      where: { id: requestId },
      data: {
        status: response === 'accept' ? 'accepted' : 'declined',
        founderResponse: message,
        respondedAt: new Date()
      }
    });

    // If accepted, reveal and send intro emails
    if (response === 'accept') {
      // Update intro request status
      await prisma.introRequest.update({
        where: { id: requestId },
        data: { status: 'intro_sent', introSentAt: new Date() }
      });

      // Find the corresponding swipe and reveal
      const swipe = await prisma.vCSwipe.findFirst({
        where: {
          vcEmail: updated.vcEmail,
          founderId: updated.founderId
        }
      });

      if (swipe) {
        await prisma.vCSwipe.update({
          where: { id: swipe.id },
          data: {
            isRevealed: true,
            revealedAt: new Date()
          }
        });
      }

      // Get full details for intro emails
      const founder = await prisma.user.findUnique({
        where: { id: updated.founderId }
      });

      const founderSession = await prisma.session.findFirst({
        where: { userId: updated.founderId },
        orderBy: { updatedAt: 'desc' }
      });

      const businessInfo = founderSession?.businessInfo as any;

      // Send email notifications (VC and Founder)
      try {
        const { sendEmail } = await import('@/lib/mailer');
        const founderEmail = founder?.email || '';
        if (founderEmail) {
          await sendEmail({
            to: founderEmail,
            subject: `Intro request from ${updated.vcFirm}`,
            text: `Hi! ${updated.vcFirm} wants to meet you. Match score: ${updated.matchScore}%. Reply in FrejFund to proceed.`,
          });
        }
        if (updated.vcEmail) {
          await sendEmail({
            to: updated.vcEmail,
            subject: `Intro accepted: ${updated.founderCompany}`,
            text: `Great! The founder accepted the intro. You can now chat directly in FrejFund and propose meeting times.`,
          });
        }
      } catch (e) {
        console.warn('Email send failed (non-fatal):', e);
      }
    }

    return NextResponse.json({ 
      success: true,
      status: updated.status
    });
  } catch (error: any) {
    console.error('Error responding to intro request:', error);
    return NextResponse.json({ 
      error: 'Failed to respond',
      details: error.message
    }, { status: 500 });
  }
}
