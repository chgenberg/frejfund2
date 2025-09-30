import { getOpenAIClient, getEmbeddingsModel } from '@/lib/ai-client';
import { chunkText } from '@/lib/text-chunker';
import { getDb } from '@/lib/db';

export interface VectorItem {
  id: string;
  text: string;
  url?: string;
  embedding: number[];
}

const sessionToItems: Map<string, VectorItem[]> = new Map();
const backend = process.env.VECTOR_BACKEND || 'memory'; // 'memory' | 'postgres'

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length && i < b.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY);
}

function generateLocalEmbedding(text: string, dims = 64): number[] {
  const vec = new Array<number>(dims).fill(0);
  const tokens = (text || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  tokens.forEach((tok) => {
    let h = 2166136261;
    for (let i = 0; i < tok.length; i++) {
      h ^= tok.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    const idx = Math.abs(h) % dims;
    vec[idx] += 1;
  });
  // L2 normalize
  const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0)) || 1;
  return vec.map((x) => x / norm);
}

async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!isOpenAIConfigured()) {
    return texts.map((t) => generateLocalEmbedding(t));
  }
  try {
    const openai = getOpenAIClient();
    const model = getEmbeddingsModel();
    const resp = await openai.embeddings.create({ model, input: texts });
    return resp.data.map((d: any) => (d.embedding as unknown as number[]) || generateLocalEmbedding(''));
  } catch {
    return texts.map((t) => generateLocalEmbedding(t));
  }
}

async function embedQuery(query: string): Promise<number[]> {
  if (!isOpenAIConfigured()) return generateLocalEmbedding(query);
  try {
    const openai = getOpenAIClient();
    const model = getEmbeddingsModel();
    const q = await openai.embeddings.create({ model, input: [query] });
    return (q.data[0].embedding as unknown as number[]) || generateLocalEmbedding(query);
  } catch {
    return generateLocalEmbedding(query);
  }
}

export async function indexContextForSession(sessionId: string, rawText: string, source?: { url?: string }): Promise<number> {
  if (!rawText) return 0;
  const chunks = chunkText(rawText, { maxChars: 1000, overlap: 150 });
  if (chunks.length === 0) return 0;
  const vectors = await embedTexts(chunks);

  if (backend === 'postgres') {
    const db = getDb();
    await db.query(`
      CREATE TABLE IF NOT EXISTS vector_items (
        session_id text,
        id text,
        text text,
        url text,
        embedding vector
      );
    `);
    const values: any[] = [];
    const placeholders: string[] = [];
    vectors.forEach((emb, i) => {
      const id = `sess:${sessionId}:chunk:${i}`;
      values.push(sessionId, id, chunks[i], source?.url || null, JSON.stringify(emb));
      placeholders.push(`($${values.length - 4}, $${values.length - 3}, $${values.length - 2}, $${values.length - 1}, $${values.length})`);
    });
    // Note: Requires pgvector extension; storing as JSON as placeholder if pgvector not available
    await db.query(
      `INSERT INTO vector_items (session_id, id, text, url, embedding) VALUES ${placeholders.join(',')}`,
      values
    );
    return chunks.length;
  } else {
    const items = sessionToItems.get(sessionId) || [];
    vectors.forEach((emb, i) => {
      items.push({
        id: `sess:${sessionId}:chunk:${items.length + i}`,
        text: chunks[i],
        url: source?.url,
        embedding: emb,
      });
    });
    sessionToItems.set(sessionId, items);
    return chunks.length;
  }
}

export async function retrieveTopK(sessionId: string, query: string, k = 3): Promise<VectorItem[]> {
  if (backend === 'postgres') {
    const db = getDb();
    const qv = await embedQuery(query);
    // Fallback: compute in app side using dot product since embedding stored as JSON text for now
    const res = await db.query('SELECT id, text, url, embedding FROM vector_items WHERE session_id = $1', [sessionId]);
    const rows = res.rows as Array<{ id: string; text: string; url: string | null; embedding: any }>; 
    const scored = rows.map(r => {
      const emb = Array.isArray(r.embedding) ? r.embedding : JSON.parse(r.embedding || '[]');
      return { it: { id: r.id, text: r.text, url: r.url || undefined, embedding: emb }, score: cosineSimilarity(emb, qv) };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k).map(s => s.it);
  }
  const items = sessionToItems.get(sessionId) || [];
  if (items.length === 0) return [];
  const qv = await embedQuery(query);
  const scored = items.map((it) => ({ it, score: cosineSimilarity(it.embedding, qv) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k).map((s) => s.it);
}


