import { NextRequest, NextResponse } from 'next/server';
import { chunkText } from '@/lib/text-chunker';
import { getOpenAIClient, getEmbeddingsModel } from '@/lib/ai-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY);
}

function generateLocalEmbedding(text: string, dims = 64): number[] {
  const vec = new Array<number>(dims).fill(0);
  const tokens = (text || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  tokens.forEach((tok) => {
    let h = 2166136261;
    for (let i = 0; i < tok.length; i++) {
      h ^= tok.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    const idx = Math.abs(h) % dims;
    vec[idx] += 1;
  });
  const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0)) || 1;
  return vec.map((x) => x / norm);
}

export async function POST(req: NextRequest) {
  try {
    const { documents } = await req.json();
    if (!documents || !Array.isArray(documents)) {
      return NextResponse.json({ error: 'documents[] required' }, { status: 400 });
    }

    // Flatten and chunk
    const chunks: { id: string; text: string }[] = [];
    documents.forEach((doc: { filename?: string; text: string }, i: number) => {
      const parts = chunkText(doc.text || '', { maxChars: 1200, overlap: 200 });
      parts.forEach((t, j) => {
        chunks.push({ id: `${doc.filename || 'doc'}#${i}:${j}`, text: t });
      });
    });

    if (chunks.length === 0) {
      return NextResponse.json({ embeddings: [] });
    }

    // Batch embed (respect input limits)
    const batchSize = 64;
    const results: { id: string; embedding: number[] }[] = [];
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      let embeddings: number[][] = [];
      try {
        if (!isOpenAIConfigured()) throw new Error('No OpenAI key');
        const client = getOpenAIClient();
        const resp = await client.embeddings.create({
          model: getEmbeddingsModel(),
          input: batch.map((b) => b.text),
        });
        embeddings = resp.data.map(
          (e) => (e.embedding as unknown as number[]) || generateLocalEmbedding(''),
        );
      } catch {
        embeddings = batch.map((b) => generateLocalEmbedding(b.text));
      }
      embeddings.forEach((emb, idx) => {
        results.push({ id: batch[idx].id, embedding: emb });
      });
    }

    return NextResponse.json({
      chunks: chunks.map((c) => c.id),
      embeddings: results,
    });
  } catch (error) {
    console.error('Embeddings API Error:', error);
    return NextResponse.json({ error: 'Failed to create embeddings' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Embeddings API is running' });
}
