import { NextRequest, NextResponse } from 'next/server';
import { syncEmailsForSession } from '@/lib/email-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorized(req: NextRequest): boolean {
  const secretHeader = req.headers.get('x-cron-secret') || req.headers.get('authorization');
  const envSecret = process.env.CRON_SECRET;
  if (!envSecret) return true; // if not set, do not block in dev
  if (!secretHeader) return false;
  if (secretHeader.startsWith('Bearer ')) {
    return secretHeader.slice('Bearer '.length) === envSecret;
  }
  return secretHeader === envSecret;
}

export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId') || undefined;
    const tenantId = url.searchParams.get('tenantId') || undefined;
    const lookbackDays = Number(url.searchParams.get('lookbackDays') || '1');

    const body = await req.json().catch(() => ({}));
    const sId = String((body as any).sessionId || sessionId || '').trim();
    const tId = String((body as any).tenantId || tenantId || '').trim();
    const lb = Number((body as any).lookbackDays || lookbackDays || 1);

    if (!sId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    const result = await syncEmailsForSession(sId, {
      tenantId: tId || undefined,
      lookbackDays: lb,
    });

    // TODO triggers: summary + proactive updates can be scheduled/queued
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error('Email Sync API Error:', error);
    return NextResponse.json({ error: 'Failed to sync emails' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Email Sync API is running' });
}
