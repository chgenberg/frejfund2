import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Save complete session data including business info, scraped content, and documents
 * Tied to user email for future retrieval
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const email = payload?.email;
    const sessionId = payload?.sessionId;
    const scrapedText = payload?.scrapedText;
    const scrapedSources = payload?.scrapedSources;
    // Accept optional goal/roadmap fields but do not persist unknown types blindly
    const businessInfo = payload?.businessInfo ?? {};

    if (!email || !sessionId) {
      return NextResponse.json({ 
        error: 'email and sessionId required' 
      }, { status: 400 });
    }

    // Create or update user
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: businessInfo?.name,
        company: businessInfo?.company,
        industry: businessInfo?.industry,
        stage: businessInfo?.stage,
        website: businessInfo?.website
      },
      create: {
        email,
        name: businessInfo?.name,
        company: businessInfo?.company,
        industry: businessInfo?.industry,
        stage: businessInfo?.stage,
        website: businessInfo?.website
      }
    });

    // Create or update session
    const session = await prisma.session.upsert({
      where: { id: sessionId },
      update: {
        userId: user.id,
        businessInfo: businessInfo || {},
        lastActivity: new Date()
      },
      create: {
        id: sessionId,
        userId: user.id,
        businessInfo: businessInfo || {},
        lastActivity: new Date()
      }
    });

    // If scraped text provided, save as document
    if (scrapedText) {
      await prisma.document.create({
        data: {
          sessionId: session.id,
          content: scrapedText,
          metadata: {
            source: 'wizard',
            sources: scrapedSources || [],
            savedAt: new Date().toISOString()
          }
        }
      });
    }

    return NextResponse.json({ 
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      session: {
        id: session.id
      }
    });
  } catch (error) {
    console.error('Session save error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: 'Failed to save session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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
