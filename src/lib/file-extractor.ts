import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// Dynamic import for pdf-parse since it may rely on node env
let pdfParse: any;
let pptxParser: any;
let tesseract: any;

(async () => {
  try {
    // @ts-ignore
    pdfParse = (await import('pdf-parse')).default || (await import('pdf-parse'));
  } catch (e) {
    // ignore; will fallback
  }
  
  try {
    // @ts-ignore
    pptxParser = await import('pptx-parser');
  } catch (e) {
    // ignore
  }
  
  try {
    tesseract = await import('tesseract.js');
  } catch (e) {
    // ignore
  }
})();

export type SupportedMime =
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/msword'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  | 'application/vnd.ms-excel'
  | 'application/vnd.openxmlformats-officedocument.presentationml.presentation' // .pptx
  | 'application/vnd.ms-powerpoint' // .ppt
  | 'text/csv'
  | 'text/plain'
  | 'text/rtf'
  | 'image/png'
  | 'image/jpeg'
  | 'image/jpg'
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

type MinimalFile = { name: string; type: string; arrayBuffer: () => Promise<ArrayBuffer> };

export async function extractFromFile(file: MinimalFile): Promise<ExtractedDoc> {
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
      
      // If no text found (might be scanned), try OCR
      if (!data.text || data.text.trim().length < 50) {
        return await extractWithOCR(arrayBuffer, name, mime);
      }
      
      return { filename: name, mimeType: mime, text: data.text };
    } catch (e) {
      // Try OCR as fallback
      return await extractWithOCR(arrayBuffer, name, mime);
    }
  }

  // PowerPoint (.pptx, .ppt)
  if (
    mime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    name.endsWith('.pptx') ||
    mime === 'application/vnd.ms-powerpoint' ||
    name.endsWith('.ppt')
  ) {
    try {
      if (!pptxParser) throw new Error('pptx-parser not available');
      
      // For .pptx, we can use officegen or manual zip parsing
      // Simplified: Try to extract as text
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(arrayBuffer);
      
      const slides: string[] = [];
      
      // Find all slide XML files
      const slideFiles = Object.keys(zip.files).filter(name => 
        name.match(/ppt\/slides\/slide\d+\.xml/)
      );
      
      for (const slideFile of slideFiles) {
        const content = await zip.files[slideFile].async('text');
        // Extract text between XML tags (simple approach)
        const textMatches = content.match(/>([^<]+)</g);
        if (textMatches) {
          const slideText = textMatches
            .map(m => m.replace(/^>/, '').replace(/<$/, ''))
            .filter(t => t.trim().length > 0)
            .join(' ');
          slides.push(slideText);
        }
      }
      
      return { 
        filename: name, 
        mimeType: mime, 
        text: slides.join('\n\n') 
      };
    } catch (e) {
      console.error('PowerPoint extraction failed:', e);
      return { filename: name, mimeType: mime, text: '' };
    }
  }

  // Keynote (.key) - Apple's presentation format
  if (name.endsWith('.key')) {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(arrayBuffer);
      
      // Keynote stores content in index.apxl or presentation.apxl
      const indexFile = zip.files['index.apxl'] || zip.files['presentation.apxl'];
      
      if (indexFile) {
        const content = await indexFile.async('text');
        // Extract text from XML/JSON structure
        const textMatches = content.match(/>([^<]+)</g);
        if (textMatches) {
          const text = textMatches
            .map(m => m.replace(/^>/, '').replace(/<$/, ''))
            .filter(t => t.trim().length > 0 && !t.match(/^[\d.]+$/))
            .join(' ');
          return { filename: name, mimeType: mime, text };
        }
      }
      
      // Fallback: Try to extract from any text files in the package
      let allText = '';
      for (const fileName in zip.files) {
        if (fileName.endsWith('.xml') || fileName.endsWith('.json')) {
          const content = await zip.files[fileName].async('text');
          const textMatches = content.match(/>([^<]+)</g);
          if (textMatches) {
            const extracted = textMatches
              .map(m => m.replace(/^>/, '').replace(/<$/, ''))
              .filter(t => t.trim().length > 0)
              .join(' ');
            allText += extracted + ' ';
          }
        }
      }
      
      return { 
        filename: name, 
        mimeType: mime, 
        text: allText.trim(),
        meta: { format: 'keynote' }
      };
    } catch (e) {
      console.error('Keynote extraction failed:', e);
      return { filename: name, mimeType: mime, text: '' };
    }
  }

  // Pages (.pages) - Apple's word processor
  if (name.endsWith('.pages')) {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(arrayBuffer);
      
      // Pages stores content in index.xml or similar
      let allText = '';
      for (const fileName in zip.files) {
        if (fileName.endsWith('.xml')) {
          const content = await zip.files[fileName].async('text');
          const textMatches = content.match(/>([^<]+)</g);
          if (textMatches) {
            const extracted = textMatches
              .map(m => m.replace(/^>/, '').replace(/<$/, ''))
              .filter(t => t.trim().length > 0)
              .join(' ');
            allText += extracted + ' ';
          }
        }
      }
      
      return { 
        filename: name, 
        mimeType: mime, 
        text: allText.trim(),
        meta: { format: 'pages' }
      };
    } catch (e) {
      console.error('Pages extraction failed:', e);
      return { filename: name, mimeType: mime, text: '' };
    }
  }

  // Numbers (.numbers) - Apple's spreadsheet
  if (name.endsWith('.numbers')) {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(arrayBuffer);
      
      let allText = '';
      for (const fileName in zip.files) {
        if (fileName.endsWith('.xml') || fileName.endsWith('.iwa')) {
          const content = await zip.files[fileName].async('text');
          // Extract numbers and text
          const matches = content.match(/[>"]([^<"]+)[<"]/g);
          if (matches) {
            const extracted = matches
              .map(m => m.replace(/[>"<]/g, ''))
              .filter(t => t.trim().length > 0)
              .join(' ');
            allText += extracted + ' ';
          }
        }
      }
      
      return { 
        filename: name, 
        mimeType: mime, 
        text: allText.trim(),
        meta: { format: 'numbers' }
      };
    } catch (e) {
      console.error('Numbers extraction failed:', e);
      return { filename: name, mimeType: mime, text: '' };
    }
  }

  // Images (PNG, JPG, JPEG) - Use OCR
  if (
    mime.startsWith('image/') ||
    name.match(/\.(png|jpg|jpeg|gif|bmp|tiff)$/i)
  ) {
    return await extractWithOCR(arrayBuffer, name, mime);
  }

  // Unknown → best effort
  return { filename: name, mimeType: mime, text: bufferToString(arrayBuffer) };
}

/**
 * Extract text from images or scanned PDFs using OCR
 */
async function extractWithOCR(
  arrayBuffer: ArrayBuffer,
  filename: string,
  mimeType: string
): Promise<ExtractedDoc> {
  try {
    if (!tesseract) {
      console.warn('Tesseract not available, skipping OCR');
      return { filename, mimeType, text: '' };
    }

    const worker = await tesseract.createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    const imageBuffer = Buffer.from(arrayBuffer);
    const { data } = await worker.recognize(imageBuffer);
    
    await worker.terminate();
    
    return {
      filename,
      mimeType,
      text: data.text,
      meta: { ocr: true, confidence: data.confidence }
    };
  } catch (error) {
    console.error('OCR extraction failed:', error);
    return { filename, mimeType, text: '' };
  }
}

export async function extractMany(files: MinimalFile[]): Promise<ExtractedDoc[]> {
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
