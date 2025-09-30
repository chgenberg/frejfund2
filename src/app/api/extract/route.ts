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
    const files: File[] = [];
    for (const [key, value] of form.entries()) {
      if (value instanceof File) files.push(value);
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
