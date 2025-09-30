export interface ChunkOptions {
  maxChars?: number; // approx token-safe chunk size
  overlap?: number; // chars to overlap between chunks
}

export function chunkText(text: string, options: ChunkOptions = {}): string[] {
  const maxChars = options.maxChars ?? 1200;
  const overlap = options.overlap ?? 200;
  if (!text) return [];

  // Normalize line breaks and trim noisy whitespace
  const normalized = text.replace(/\r\n?/g, '\n').replace(/\t/g, '  ').trim();

  // First split by double newlines (paragraphs)
  const paragraphs = normalized.split(/\n\s*\n/);
  const chunks: string[] = [];
  let current = '';

  for (const p of paragraphs) {
    if ((current + '\n\n' + p).length <= maxChars) {
      current = current ? current + '\n\n' + p : p;
    } else {
      if (current) chunks.push(current);
      // If a single paragraph is too large, hard-slice it
      if (p.length > maxChars) {
        let start = 0;
        while (start < p.length) {
          const end = Math.min(start + maxChars, p.length);
          chunks.push(p.slice(start, end));
          start = end - overlap; // maintain overlap between hard slices
          if (start < 0) start = 0;
        }
        current = '';
      } else {
        current = p;
      }
    }
  }

  if (current) chunks.push(current);

  // Add overlaps between soft chunks
  if (overlap > 0 && chunks.length > 1) {
    const withOverlap: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      if (i === 0) {
        withOverlap.push(c);
      } else {
        const prev = chunks[i - 1];
        const tail = prev.slice(Math.max(0, prev.length - overlap));
        withOverlap.push(tail + '\n' + c);
      }
    }
    return withOverlap;
  }

  return chunks;
}


