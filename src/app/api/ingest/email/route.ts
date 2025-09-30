import { NextRequest, NextResponse } from 'next/server';
import { indexContextForSession } from '@/lib/vector-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface IngestEmail {
  subject?: string;
  from?: string;
  to?: string | string[];
  date?: string;
  body?: string;
  threadId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, emails } = await req.json();
    if (!sessionId || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'sessionId and emails[] required' }, { status: 400 });
    }

    let totalChunks = 0;
    for (const e of emails as IngestEmail[]) {
      const lines: string[] = [];
      if (e.subject) lines.push(`Subject: ${e.subject}`);
      if (e.from) lines.push(`From: ${e.from}`);
      if (e.to) lines.push(`To: ${Array.isArray(e.to) ? e.to.join(', ') : e.to}`);
      if (e.date) lines.push(`Date: ${e.date}`);
      if (e.body) lines.push(`Body:\n${e.body}`);
      const text = lines.join('\n');
      if (!text) continue;
      const chunks = await indexContextForSession(sessionId, text, { url: e.subject ? `email:${e.subject}` : 'email' });
      totalChunks += chunks;
    }

    return NextResponse.json({ ok: true, indexedChunks: totalChunks });
  } catch (error) {
    console.error('Email Ingest Error:', error);
    return NextResponse.json({ error: 'Failed to ingest emails' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Email ingest API is running' });
}


