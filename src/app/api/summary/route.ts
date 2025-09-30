import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, getChatModel } from '@/lib/ai-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function summarizeWithFallback(input: string) {
  const client = getOpenAIClient();
  const model = getChatModel();
  const isGpt5 = model.startsWith('gpt-5');
  const system = 'You are a world-class startup coach. Return only strict JSON.';
  try {
    const r = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: input }
      ],
      ...(isGpt5 ? {} : { temperature: 0.4 })
    });
    return r.choices[0]?.message?.content || '';
  } catch {
    try {
      const r2: any = await (client as any).responses.create({ model, input: `${system}\n\n${input}`, ...(isGpt5 ? {} : { temperature: 0.4 }) });
      return (r2 as any).output_text || '';
    } catch {
      return '';
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { businessInfo, websiteText, emails, kpiPreview } = await req.json();
    if (!businessInfo) return NextResponse.json({ error: 'businessInfo required' }, { status: 400 });

    const input = `Create a concise company summary and proactive recommendations. Return strict JSON with shape {"summary":"","recommendations":[""],"questions":[""]}.

Company:
- Name: ${businessInfo.name}
- Stage: ${businessInfo.stage}
- Industry: ${businessInfo.industry}
- Target: ${businessInfo.targetMarket}
- Business model: ${businessInfo.businessModel}
- Revenue: ${businessInfo.monthlyRevenue}
- Team: ${businessInfo.teamSize}

Website hints (optional):\n${(websiteText || '').slice(0, 2000)}
Recent emails (optional, snippets):\n${Array.isArray(emails) ? emails.map((e:any)=> `- ${e.subject}: ${String(e.body||'').slice(0,160)}`).join('\n') : ''}
KPIs (optional):\n${kpiPreview ? JSON.stringify(kpiPreview).slice(0,800) : ''}

Focus on: investment readiness, growth levers, numeric targets for 90 days, and one high-leverage question.`;

    const hasKey = Boolean(process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY);
    let content = '';
    if (!hasKey) {
      const fallback = { summary: `${businessInfo.name} in ${businessInfo.industry} at ${businessInfo.stage} stage.`, recommendations: ["Prioritize 90‑day plan", "Talk to 10 customers", "Define pricing"], questions: ["What is your next milestone?", "Who is your ICP?", "What is your pricing?"] };
      return NextResponse.json(fallback);
    }
    content = await summarizeWithFallback(input);
    let json: any;
    try { json = JSON.parse((content || '{}').match(/\{[\s\S]*\}/)?.[0] || '{}'); } catch { json = {}; }
    if (!json.summary) {
      json = { summary: `${businessInfo.name} in ${businessInfo.industry} at ${businessInfo.stage} stage.`, recommendations: [], questions: [] };
    }
    return NextResponse.json(json);
  } catch (e) {
    console.error('Summary API Error:', e);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Summary API is running' });
}


