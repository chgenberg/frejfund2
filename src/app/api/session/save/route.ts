import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, sessionId, businessInfo, ...rest } = await req.json();
    const id = sessionId || `sess-${Date.now()}`;

    // Upsert user by email if provided
    let userId: string | null = null;
    if (email) {
      const user = await prisma.user.upsert({
        where: { email },
        update: { updatedAt: new Date() },
        create: { email }
      });
      userId = user.id;
    }

    // Upsert session
    await prisma.session.upsert({
      where: { id },
      update: {
        userId: userId || undefined,
        businessInfo: businessInfo || undefined,
        lastActivity: new Date()
      },
      create: {
        id,
        userId,
        businessInfo
      }
    });

    const res = NextResponse.json({ success: true, sessionId: id, ...rest });
    // Set stable HttpOnly cookie for session id
    res.cookies.set('ff-session', id, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });
    return res;
  } catch (error) {
    console.error('Session save error:', error);
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
  }
}

// GET - Retrieve user's sessions
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'email required' }, { status: 400 });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        sessions: {
          orderBy: { lastActivity: 'desc' },
          take: 10,
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1 // Last message for preview
            },
            documents: {
              take: 1,
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        industry: user.industry,
        stage: user.stage
      },
      sessions: user.sessions.map(s => ({
        id: s.id,
        businessInfo: s.businessInfo,
        lastActivity: s.lastActivity,
        messageCount: s.messages.length,
        lastMessage: s.messages[0]?.content?.substring(0, 100),
        hasDocuments: s.documents.length > 0
      }))
    });
  } catch (error) {
    console.error('Session retrieve error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: 'Failed to retrieve sessions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
