import { BusinessInfo } from '@/types/business';
import { getOpenAIClient, getChatModel } from './ai-client';

type KnowledgeChunk = {
  category: string;
  content: string; // compact text summary
};

export interface GptKnowledgeResult {
  combinedText: string; // concatenated chunks
  chunks: KnowledgeChunk[];
}

const CATEGORY_BATCHES: { category: string; prompt: (bi: BusinessInfo) => string }[] = [
  {
    category: 'Company Basics',
    prompt: (bi) => `Summarize known public info about ${bi.companyName || bi.name || 'the company'}: founding year, HQ/country, founders, product summary, market segment, pricing level, notable customers, funding history, and press mentions. Return compact bullet points.`,
  },
  {
    category: 'Market & Competition',
    prompt: (bi) => `For ${bi.companyName || bi.name || 'the company'}, summarize market size signals, competitors, differentiators, and timing. Return concise bullets.`,
  },
  {
    category: 'Traction & Metrics',
    prompt: (bi) => `For ${bi.companyName || bi.name || 'the company'}, list any public traction metrics (MRR/ARR, growth, users, customers), notable logos, and retention signals. If unknown, state unknown.`,
  },
  {
    category: 'Team & Execution',
    prompt: (bi) => `For ${bi.companyName || bi.name || 'the company'}, summarize team highlights: founder backgrounds, team size signals, hiring momentum, and notable advisors.`,
  },
  {
    category: 'Product & Technology',
    prompt: (bi) => `For ${bi.companyName || bi.name || 'the company'}, summarize product, tech stack hints, IP/moat, integrations, and ecosystem role.`,
  },
  {
    category: 'Fundraising & Capital',
    prompt: (bi) => `For ${bi.companyName || bi.name || 'the company'}, summarize funding events, investors, stage alignment, and planned use of funds if known.`,
  },
  {
    category: 'Risks & Red Flags',
    prompt: (bi) => `For ${bi.companyName || bi.name || 'the company'}, summarize any apparent risks: regulation, competition, dependency, market headwinds.`,
  },
];

/**
 * Fetch public knowledge from gpt-5-mini in small batches.
 * Intentionally compact; used as a low-priority context source.
 */
export async function fetchGptKnowledgeForCompany(businessInfo: BusinessInfo, signal?: AbortSignal): Promise<GptKnowledgeResult> {
  const openai = getOpenAIClient();
  const model = getChatModel('simple'); // gpt-5-mini

  const chunks: KnowledgeChunk[] = [];

  for (const batch of CATEGORY_BATCHES) {
    try {
      const messages = [
        {
          role: 'system' as const,
          content: `You aggregate concise, factual public knowledge.
Rules:
- If unsure, say "unknown".
- Keep to compact bullet points (<=8 bullets), max ~120 words total.
- Do not fabricate figures; prefer qualitative phrasing if no numbers.
- Return ONLY text, no JSON, no markdown headers.
Context company: ${businessInfo.companyName || businessInfo.name || 'Unknown'} (${businessInfo.website || 'no-website-provided'})`,
        },
        { role: 'user' as const, content: batch.prompt(businessInfo) },
      ];

      const resp = await openai.chat.completions.create({
        model,
        messages,
        ...(model.startsWith('gpt-5') ? { max_completion_tokens: 600 } : { max_tokens: 600 }),
        temperature: 0.2,
        stream: false,
      }, { signal } as any);

      const text = (resp.choices?.[0]?.message?.content || '').trim().slice(0, 1200);
      if (text) chunks.push({ category: batch.category, content: text });
    } catch (err) {
      // Skip batch on error; continue others
    }
  }

  const combinedText = chunks
    .map((c) => `### ${c.category}\n${c.content}`)
    .join('\n\n')
    .slice(0, 4000);

  return { combinedText, chunks };
}


