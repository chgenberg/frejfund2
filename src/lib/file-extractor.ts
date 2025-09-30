import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// Dynamic import for pdf-parse since it may rely on node env
let pdfParse: any;
(async () => {
  try {
    // @ts-ignore
    pdfParse = (await import('pdf-parse')).default || (await import('pdf-parse'));
  } catch (e) {
    // ignore; will fallback
  }
})();

export type SupportedMime =
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/msword'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  | 'application/vnd.ms-excel'
  | 'text/csv'
  | 'text/plain'
  | string;

export interface ExtractedDoc {
  filename: string;
  mimeType: SupportedMime;
  text: string;
  meta?: Record<string, unknown>;
}

function bufferToString(buf: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(buf));
  } catch {
    try {
      return new TextDecoder('latin1', { fatal: false }).decode(new Uint8Array(buf));
    } catch {
      return '';
    }
  }
}

export async function extractFromFile(file: File): Promise<ExtractedDoc> {
  const arrayBuffer = await file.arrayBuffer();
  const mime = file.type as SupportedMime;
  const name = file.name;

  // TXT
  if (mime.startsWith('text/') || name.endsWith('.txt')) {
    const text = bufferToString(arrayBuffer);
    return { filename: name, mimeType: mime, text };
  }

  // CSV
  if (mime === 'text/csv' || name.endsWith('.csv')) {
    const csvText = bufferToString(arrayBuffer);
    const parsed = Papa.parse<string[]>(csvText, { skipEmptyLines: true });
    const text = parsed.data.map((row) => row.join('\t')).join('\n');
    return { filename: name, mimeType: mime, text };
  }

  // DOCX/DOC via mammoth
  if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx') ||
    mime === 'application/msword' ||
    name.endsWith('.doc')
  ) {
    try {
      const { value } = await mammoth.extractRawText({ arrayBuffer });
      return { filename: name, mimeType: mime, text: value };
    } catch (e) {
      // fallback to binary to string
      return { filename: name, mimeType: mime, text: bufferToString(arrayBuffer) };
    }
  }

  // XLSX/XLS via sheetjs
  if (
    mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    name.endsWith('.xlsx') ||
    mime === 'application/vnd.ms-excel' ||
    name.endsWith('.xls')
  ) {
    const wb = XLSX.read(arrayBuffer, { type: 'array' });
    const sheets = wb.SheetNames;
    const chunks: string[] = [];
    sheets.forEach((sheetName) => {
      const ws = wb.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(ws, { FS: '\t' });
      chunks.push(`# ${sheetName}\n${csv}`);
    });
    return { filename: name, mimeType: mime, text: chunks.join('\n\n') };
  }

  // PDF via pdf-parse (Node only; in edge runtimes fallback)
  if (mime === 'application/pdf' || name.endsWith('.pdf')) {
    try {
      if (!pdfParse) throw new Error('pdf-parse not available in this runtime');
      const data = await pdfParse(Buffer.from(arrayBuffer));
      return { filename: name, mimeType: mime, text: data.text };
    } catch (e) {
      // fallback naive (not perfect but better than nothing)
      return { filename: name, mimeType: mime, text: '' };
    }
  }

  // Unknown → best effort
  return { filename: name, mimeType: mime, text: bufferToString(arrayBuffer) };
}

export async function extractMany(files: File[]): Promise<ExtractedDoc[]> {
  const results: ExtractedDoc[] = [];
  for (const f of files) {
    try {
      const doc = await extractFromFile(f);
      // Trim huge texts to protect token limits on first pass
      doc.text = doc.text?.slice(0, 200_000) || '';
      results.push(doc);
    } catch (e) {
      results.push({ filename: f.name, mimeType: f.type as SupportedMime, text: '' });
    }
  }
  return results;
}
