import { NextResponse } from 'next/server';
import { getChatModel } from '@/lib/ai-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const hasKey = Boolean((process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || process.env.OPENAI_TOKEN || '').trim() || process.env.AZURE_OPENAI_API_KEY);
  const project = process.env.OPENAI_PROJECT || null;
  const model = getChatModel();
  return NextResponse.json({ ok: true, hasKey, project, model, env: process.env.NODE_ENV });
}


