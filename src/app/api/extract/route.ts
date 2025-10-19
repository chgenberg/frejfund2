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
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
    const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total
    let totalSize = 0;

    for (const [, value] of form.entries()) {
      // In Node 18, global File may be undefined; accept any Blob-like entry
      const looksLikeFile = hasFileGlobal
        ? value instanceof File
        : value && typeof (value as any).arrayBuffer === 'function';
      if (looksLikeFile) {
        const fileSize = (value as any).size || 0;

        // Check individual file size
        if (fileSize > MAX_FILE_SIZE) {
          return NextResponse.json(
            {
              error: `File "${(value as any).name}" is too large. Max size: 10MB`,
            },
            { status: 400 },
          );
        }

        totalSize += fileSize;

        // Check total size
        if (totalSize > MAX_TOTAL_SIZE) {
          return NextResponse.json(
            {
              error: 'Total upload size exceeds 50MB limit',
            },
            { status: 400 },
          );
        }

        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    if (files.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 files allowed' }, { status: 400 });
    }

    const extracted = await extractMany(files);

    // Extract metrics from the content
    const { extractMetricsFromText } = await import('@/lib/metric-extractor');
    const allText = extracted.map((e) => e.text).join('\n\n');
    const metrics = await extractMetricsFromText(allText);

    // Save to database (non-blocking)
    const sessionId = req.headers.get('x-session-id');
    if (sessionId) {
      (async () => {
        try {
          const prisma = (await import('@/lib/prisma')).default;
          await prisma.session.upsert({
            where: { id: sessionId },
            update: {},
            create: { id: sessionId },
          });

          for (const doc of extracted) {
            await prisma.document.create({
              data: {
                sessionId,
                content: doc.text || '',
                metadata: {
                  source: 'upload',
                  filename: doc.filename,
                  fileType: doc.fileType,
                  uploadedAt: new Date().toISOString(),
                },
              },
            });
          }
          console.log(`Saved ${extracted.length} uploaded files to database`);
        } catch (e) {
          console.error('Failed to save uploaded files:', e);
        }
      })();
    }

    return NextResponse.json({
      documents: extracted,
      metrics,
      hasMetrics: metrics.confidence > 50,
    });
  } catch (error) {
    console.error('Extract API Error:', error);
    return NextResponse.json({ error: 'Failed to extract documents' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Extract API is running' });
}
