import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const secretHeader = req.headers.get('x-cron-secret') || req.headers.get('authorization') || '';
  const envSecret = process.env.CRON_SECRET || '';

  if (envSecret && secretHeader !== envSecret) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  const keys = {
    OPENAI_API_KEY: Boolean(
      (
        process.env.OPENAI_API_KEY ||
        process.env.OPENAI_KEY ||
        process.env.OPENAI_TOKEN ||
        ''
      ).trim(),
    ),
    OPENAI_CHAT_MODEL: process.env.OPENAI_CHAT_MODEL || null,
    OPENAI_BASE_URL: Boolean(process.env.OPENAI_BASE_URL || process.env.OPENAI_API_BASE),
    OPENAI_PROJECT: Boolean(process.env.OPENAI_PROJECT),
    AZURE_OPENAI_API_KEY: Boolean(process.env.AZURE_OPENAI_API_KEY),
    AZURE_OPENAI_ENDPOINT: Boolean(process.env.AZURE_OPENAI_ENDPOINT),
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    DB_SSL: process.env.DB_SSL ?? null,
    VECTOR_BACKEND: process.env.VECTOR_BACKEND || 'memory',
    SCRAPE_MAX_PAGES: process.env.SCRAPE_MAX_PAGES ?? null,
    NODE_ENV: process.env.NODE_ENV || null,
  } as const;

  return NextResponse.json({ ok: true, keys });
}
