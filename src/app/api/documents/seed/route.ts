import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/documents/seed - Create sample documents for demo/first-time users
export async function POST(req: NextRequest) {
  try {
    const sessionId = req.headers.get('x-session-id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Check if documents already exist
    const existing = await prisma.generatedDocument.findFirst({
      where: { sessionId },
    });

    if (existing) {
      return NextResponse.json({ message: 'Documents already exist' }, { status: 200 });
    }

    // Create sample documents
    const sampleDocs = [
      {
        sessionId,
        type: 'pitch_deck',
        title: 'Pitch Deck',
        description: 'AI-generated investor pitch presentation',
        status: 'ready',
        version: 'v1.0',
        viewCount: 0,
        shareCount: 0,
        generatedBy: 'gpt-5',
        content: {
          slides: [
            { title: 'Problem', content: 'Based on your business info...' },
            { title: 'Solution', content: 'Your unique approach...' },
            { title: 'Market', content: 'Market opportunity...' },
            { title: 'Traction', content: 'Current metrics...' },
          ],
        },
      },
      {
        sessionId,
        type: 'one_pager',
        title: 'One-Pager',
        description: 'Executive summary for quick investor review',
        status: 'draft',
        version: 'v1.0',
        viewCount: 0,
        shareCount: 0,
        generatedBy: 'gpt-5',
      },
      {
        sessionId,
        type: 'investor_update',
        title: 'Monthly Investor Update',
        description: 'March 2025 update - Ready to send',
        status: 'draft',
        viewCount: 0,
        shareCount: 0,
        generatedBy: 'gpt-5',
        content: {
          metrics: {
            mrr: 'Connect your data to auto-populate',
            users: 'Connect your data to auto-populate',
          },
          highlights: ['AI will generate highlights based on your connected data'],
          lowlights: ['Challenges will be identified automatically'],
          asks: ['Suggestions will appear based on your goals'],
        },
      },
    ];

    const created = await prisma.generatedDocument.createMany({
      data: sampleDocs,
    });

    return NextResponse.json(
      {
        message: 'Sample documents created',
        count: created.count,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error seeding documents:', error);
    return NextResponse.json({ error: 'Failed to seed documents' }, { status: 500 });
  }
}
