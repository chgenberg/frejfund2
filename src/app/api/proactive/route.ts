import { NextRequest, NextResponse } from 'next/server';
import { retrieveTopK } from '@/lib/vector-store';
import { getOpenAIClient, getChatModel } from '@/lib/ai-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, businessInfo } = await req.json();
    if (!sessionId || !businessInfo) {
      return NextResponse.json({ error: 'sessionId and businessInfo required' }, { status: 400 });
    }

    const top = await retrieveTopK(sessionId, 'recent insights and issues to act on', 5);
    const context = top.map((t, i) => `[${i + 1}] ${t.text}`).join('\n\n');

    const model = getChatModel();
    const hasKey = Boolean(process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY);
    if (!hasKey) {
      const tips = top.slice(0, 3).map((t, i) => ({
        title: `Tip ${i + 1}: ${t.text.slice(0, 60)}`,
        why: 'Based on recent context',
        action: 'Follow up within 24h',
        priority: i === 0 ? 'high' : 'medium',
      }));
      return NextResponse.json({ tips });
    }
    const client = getOpenAIClient();
    const prompt = `You are an investment-readiness coach. Given the company's context and recent ingested items, produce JSON only with shape {"tips":[{"title":"","why":"","action":"","priority":"high|medium|low"}...]}. No prose.

Company:
Name: ${businessInfo.name}
Stage: ${businessInfo.stage}
Industry: ${businessInfo.industry}
Target: ${businessInfo.targetMarket}
Business model: ${businessInfo.businessModel}
Revenue: ${businessInfo.monthlyRevenue}
Team: ${businessInfo.teamSize}

Context (citations inline like [1], [2]):
${context}`;

    let content = '';
    const isGpt5 = model.startsWith('gpt-5');
    try {
      const resp = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: 'Return only strict JSON.' },
          { role: 'user', content: prompt },
        ],
        ...(isGpt5 ? {} : { temperature: 0.3 }),
      });
      content = resp.choices[0]?.message?.content || '';
    } catch (e) {
      // Responses API fallback
      try {
        const r = await (client as any).responses.create({
          model,
          input: prompt,
          ...(isGpt5 ? {} : { temperature: 0.3 }),
        });
        content = (r as any).output_text || '';
      } catch {}
    }
    if (!content) content = '{}';
    let json: any;
    try {
      json = JSON.parse(content);
    } catch {
      json = { tips: [] };
    }
    return NextResponse.json({ tips: Array.isArray(json.tips) ? json.tips : [] });
  } catch (error) {
    console.error('Proactive Tips Error:', error);
    return NextResponse.json({ error: 'Failed to generate tips' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Proactive tips API is running' });
}
