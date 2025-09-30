import { NextRequest, NextResponse } from 'next/server';
import { extractMany } from '@/lib/file-extractor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
    }

    const form = await req.formData();
    const files: any[] = [];
    const hasFileGlobal = typeof File !== 'undefined';
    for (const [, value] of form.entries()) {
      // In Node 18, global File may be undefined; accept any Blob-like entry
      const looksLikeFile = hasFileGlobal ? (value instanceof File) : (value && typeof (value as any).arrayBuffer === 'function');
      if (looksLikeFile) files.push(value);
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const extracted = await extractMany(files);
    return NextResponse.json({ documents: extracted });
  } catch (error) {
    console.error('Extract API Error:', error);
    return NextResponse.json({ error: 'Failed to extract documents' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Extract API is running' });
}
