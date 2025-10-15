import { NextRequest, NextResponse } from 'next/server';
import { aiAnalyzer } from '@/lib/openai';
import { BusinessInfo } from '@/types/business';
import { indexContextForSession, retrieveTopK } from '@/lib/vector-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { message, businessInfo, conversationHistory, docContext, sessionId } = await request.json();

    if (!message || !businessInfo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Parse metrics from user message and trigger re-analysis if found
    let metricsExtracted = false;
    let extractedCount = 0;
    if (sessionId) {
      try {
        const metricsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/metrics/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, userMessage: message })
        });
        if (metricsResponse.ok) {
          const metricsData = await metricsResponse.json();
          if (metricsData.metricsFound) {
            metricsExtracted = true;
            extractedCount = metricsData.count || 0;
            console.log(`📊 Extracted ${extractedCount} metrics, re-analyzing ${metricsData.affectedDimensions?.length || 0} dimensions`);
          }
        }
      } catch (error) {
        console.log('Metric parsing skipped:', error);
      }
    }

    // Index provided docContext into session store (once per call ok for now)
    if (sessionId && docContext) {
      try { await indexContextForSession(sessionId, docContext, { url: (businessInfo as BusinessInfo)?.website }); } catch {}
    }

    // Retrieve top-k context for the question
    let retrieved = [] as { text: string; url?: string }[];
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
    
    // Try normal path first
    let response: string | null = null;
    try {
      response = await aiAnalyzer.generateChatResponse(
        withDocMessage,
        businessInfo as BusinessInfo,
        (Array.isArray(conversationHistory) ? (conversationHistory as any[]).filter((m:any)=> m?.type !== 'summary') : []),
        sessionId
      );
    } catch (e) {
      // First retry after short delay
      await new Promise(r=>setTimeout(r, 400));
      try {
        response = await aiAnalyzer.generateChatResponse(
          withDocMessage,
          businessInfo as BusinessInfo,
          (Array.isArray(conversationHistory) ? (conversationHistory as any[]).filter((m:any)=> m?.type !== 'summary') : []),
          sessionId
        );
      } catch (e2) {
        // Degrade to lighter complexity if provider is flaky
        try {
          const lightMsg = `${withDocMessage}\n\nIf unsure, answer briefly and ask one follow-up.`;
          const { getOpenAIClient } = await import('@/lib/ai-client');
          const client = getOpenAIClient();
          const miniModel = 'gpt-5-mini';
          const r = await client.chat.completions.create({
            model: miniModel,
            messages: [
              { role: 'system', content: 'You are Freja. Be concise, professional, no emojis. Use markdown.' },
              { role: 'user', content: lightMsg }
            ],
            max_tokens: 600
          } as any);
          response = r.choices?.[0]?.message?.content || 'I had trouble connecting, but here is a brief answer.';
        } catch (e3) {
          console.error('Chat degraded fallback failed:', e3);
          return NextResponse.json(
            { error: 'Upstream temporary failure' },
            { status: 502 }
          );
        }
      }
    }

    // Build sources metadata for UI
    const sources = retrieved.map((r, i) => ({
      id: i + 1,
      url: r.url,
      snippet: r.text.slice(0, 200)
    }));

    return NextResponse.json({ response, sources });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Chat API is running' });
}
