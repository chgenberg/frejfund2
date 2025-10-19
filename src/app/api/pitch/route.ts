import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, getChatModel } from '@/lib/ai-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function summarizeWithFallback(deckText: string, businessInfo: any) {
  const client = getOpenAIClient();
  const model = getChatModel();
  const isGpt5 = model.startsWith('gpt-5');
  const system = 'You are an investment analyst. Return only strict JSON.';
  const user = `Summarize the following pitch deck text into JSON with shape {"summary":"","faq":[{"q":"","a":""}],"highlights":[""],"risks":[""],"next_steps":[""]}. Keep answers concise, investor-friendly, and grounded in content. If info is missing, infer carefully.\n\nCompany: ${businessInfo?.name || ''} (${businessInfo?.industry || ''}, ${businessInfo?.stage || ''})\nBusiness model: ${businessInfo?.businessModel || ''}\n\nPitch deck text:\n${deckText.slice(0, 18000)}`;
  try {
    const r = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      ...(isGpt5 ? {} : { temperature: 0.3 }),
    });
    return r.choices[0]?.message?.content || '';
  } catch {
    try {
      const r2: any = await (client as any).responses.create({
        model,
        input: `${system}\n\n${user}`,
        ...(isGpt5 ? {} : { temperature: 0.3 }),
      });
      return (r2 as any).output_text || '';
    } catch {
      return '';
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { businessInfo, deckText } = await req.json();
    if (!deckText) return NextResponse.json({ error: 'deckText required' }, { status: 400 });
    let content = await summarizeWithFallback(deckText, businessInfo);
    let json: any;
    try {
      json = JSON.parse((content || '{}').match(/\{[\s\S]*\}/)?.[0] || '{}');
    } catch {
      json = {};
    }
    if (!json.summary) {
      json = {
        summary: deckText.split('\n').slice(0, 10).join(' ').slice(0, 600),
        faq: [],
        highlights: [],
        risks: [],
        next_steps: [],
      };
    }
    return NextResponse.json(json);
  } catch (e) {
    console.error('Pitch API Error:', e);
    return NextResponse.json({ error: 'Failed to summarize deck' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Pitch API is running' });
}
