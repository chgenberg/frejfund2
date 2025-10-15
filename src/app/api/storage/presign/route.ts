import { NextRequest, NextResponse } from 'next/server';
import { getPresignedPutUrl } from '@/lib/aws-s3';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { filename, contentType } = await req.json();
    if (!filename || !contentType) {
      return NextResponse.json({ error: 'filename and contentType required' }, { status: 400 });
    }
    const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}/${filename}`;
    const signed = await getPresignedPutUrl({ key, contentType });
    if (!signed) return NextResponse.json({ error: 'S3 not configured' }, { status: 501 });
    return NextResponse.json({ url: signed.url, key: signed.key });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create presigned URL' }, { status: 500 });
  }
}


