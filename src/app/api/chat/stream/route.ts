import { NextRequest } from 'next/server';
import { aiAnalyzer } from '@/lib/openai';
import { BusinessInfo } from '@/types/business';
import { indexContextForSession, retrieveTopK } from '@/lib/vector-store';
import { getOpenAIClient, getChatModel } from '@/lib/ai-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { message, businessInfo, docContext, sessionId, conversationHistory } = await req.json();
  if (!message || !businessInfo) {
    return new Response('Missing required fields', { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // Index incoming context
        if (sessionId && docContext) {
          try { await indexContextForSession(sessionId, docContext, { url: (businessInfo as BusinessInfo)?.website }); } catch {}
        }

        // Retrieve top-k
        let retrieved: { text: string; url?: string }[] = [];
        if (sessionId) {
          try {
            const top = await retrieveTopK(sessionId, message, 3);
            retrieved = top.map(t => ({ text: t.text, url: t.url }));
          } catch {}
        }

        const contextBlock = [
          docContext ? `User-provided context:\n${docContext}` : '',
          retrieved.length ? `Retrieved context (top matches):\n${retrieved.map((r,i)=>`[${i+1}] ${r.text}`).join('\n\n')}` : ''
        ].filter(Boolean).join('\n\n');

        const withDocMessage = contextBlock
          ? `${message}\n\nUse the following context if helpful. Cite matches as [1], [2], etc.:\n${contextBlock}`
          : message;

        const openai = getOpenAIClient();
        const model = getChatModel();

        const isGpt5 = model.startsWith('gpt-5');
        const streamResp = await openai.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: (aiAnalyzer as any).systemPrompt || 'You are a helpful assistant.' },
            ...(Array.isArray(conversationHistory) ? conversationHistory.filter((m:any)=> m?.type !== 'summary') : []),
            { role: 'user', content: withDocMessage }
          ],
          ...(isGpt5 ? {} : { temperature: 0.7 }),
          stream: true
        } as any);

        for await (const chunk of streamResp as any) {
          const delta = chunk?.choices?.[0]?.delta?.content;
          if (delta) controller.enqueue(encoder.encode(delta));
        }

        // Finalize with sources sentinel for client
        const sources = retrieved.map((r, i) => ({ id: i + 1, url: r.url, snippet: r.text.slice(0, 200) }));
        controller.enqueue(encoder.encode(`\n<<<SOURCES:${JSON.stringify(sources)}>>>`));
        controller.close();
      } catch (e) {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    }
  });
}


