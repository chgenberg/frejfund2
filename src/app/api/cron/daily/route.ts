import { NextRequest, NextResponse } from 'next/server';
import { retrieveTopK } from '@/lib/vector-store';
import { getOpenAIClient, getChatModel } from '@/lib/ai-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorized(req: NextRequest): boolean {
  const url = new URL(req.url);
  // Allow explicit UI-triggered calls without secret for demo/interactive usage
  if (url.searchParams.get('ui') === '1') return true;

  const secretHeader = req.headers.get('x-cron-secret') || req.headers.get('authorization');
  const envSecret = process.env.CRON_SECRET;
  if (!envSecret) return true;
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

    const { sessionId } = await req.json().catch(() => ({}));
    const url = new URL(req.url);
    const sId = String(sessionId || url.searchParams.get('sessionId') || '').trim();
    if (!sId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

    // Retrieve context (simple heuristic for MVP)
    const topForInsights = await retrieveTopK(sId, 'key updates, highlights, wins', 5);
    const topForRisks = await retrieveTopK(sId, 'issues, problems, churn, delays, risks', 5);
    const topForActions = await retrieveTopK(sId, 'next steps, follow ups, actions', 5);

    const context = [
      ...topForInsights.map((t, i) => `[I${i + 1}] ${t.text}`),
      ...topForRisks.map((t, i) => `[R${i + 1}] ${t.text}`),
      ...topForActions.map((t, i) => `[A${i + 1}] ${t.text}`),
    ].join('\n\n');

    const model = getChatModel();
    const hasKey = Boolean(process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY);
    let content = '';
    if (!hasKey) {
      const fallback = {
        insights: topForInsights
          .slice(0, 3)
          .map((t) => t.text)
          .concat(['New email analyzed'])
          .slice(0, 3),
        risks: topForRisks
          .slice(0, 3)
          .map((t) => t.text)
          .concat(['Pipeline slip risk'])
          .slice(0, 3),
        actions: topForActions
          .slice(0, 3)
          .map((t) => t.text)
          .concat(['Follow up with warm leads'])
          .slice(0, 3),
        citations: [],
      } as const;
      return NextResponse.json(fallback);
    }
    const client = getOpenAIClient();
    const prompt = `You are Freja, generating a short Daily Compass. Return STRICT JSON only with shape {"insights":[""],"risks":[""],"actions":[""],"citations":[{"label":"","snippet":""}]}. Keep each array length 3. Use concise phrases.

Context (with labels):\n${context}`;

    const isGpt5 = model.startsWith('gpt-5');
    try {
      const r = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: 'Return only strict JSON.' },
          { role: 'user', content: prompt },
        ],
        ...(isGpt5 ? {} : { temperature: 0.3 }),
      });
      content = r.choices[0]?.message?.content || '';
    } catch {
      try {
        const r2: any = await (client as any).responses.create({
          model,
          input: prompt,
          ...(isGpt5 ? {} : { temperature: 0.3 }),
        });
        content = (r2 as any).output_text || '';
      } catch {}
    }
    if (!content) content = '{}';
    let json: any;
    try {
      json = JSON.parse(content);
    } catch {
      json = {};
    }
    const safe = {
      insights: Array.isArray(json.insights) ? json.insights.slice(0, 3) : [],
      risks: Array.isArray(json.risks) ? json.risks.slice(0, 3) : [],
      actions: Array.isArray(json.actions) ? json.actions.slice(0, 3) : [],
      citations: Array.isArray(json.citations) ? json.citations.slice(0, 3) : [],
    };

    // Save insights to database (non-blocking)
    (async () => {
      try {
        const prisma = (await import('@/lib/prisma')).default;
        const session = await prisma.session.findUnique({
          where: { id: sId },
          include: { user: true },
        });
        if (session?.userId) {
          await prisma.insight.createMany({
            data: [
              ...safe.insights.map((i) => ({
                userId: session.userId!,
                type: 'daily_insight',
                title: String(i).substring(0, 100),
                description: String(i),
                category: 'growth',
                priority: 'medium',
              })),
              ...safe.risks.map((r) => ({
                userId: session.userId!,
                type: 'risk',
                title: String(r).substring(0, 100),
                description: String(r),
                category: 'risk',
                priority: 'high',
              })),
              ...safe.actions.map((a) => ({
                userId: session.userId!,
                type: 'action',
                title: String(a).substring(0, 100),
                description: String(a),
                category: 'action',
                priority: 'high',
              })),
            ],
          });
        }
      } catch (e) {
        console.error('Failed to save insights:', e);
      }
    })();

    return NextResponse.json(safe);
  } catch (e) {
    console.error('Daily Cron Error:', e);
    return NextResponse.json({ error: 'Failed to build daily compass' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Daily Cron API is running' });
}
