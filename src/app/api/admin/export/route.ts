import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const introRequests = await prisma.introRequest.findMany({ orderBy: { requestedAt: 'desc' } });
    const rows = [
      [
        'id',
        'vcEmail',
        'vcFirm',
        'founderId',
        'founderName',
        'founderCompany',
        'matchScore',
        'status',
        'requestedAt',
        'respondedAt',
        'meetingScheduled',
      ].join(','),
    ];
    for (const ir of introRequests) {
      rows.push(
        [
          ir.id,
          ir.vcEmail,
          ir.vcFirm,
          ir.founderId,
          ir.founderName,
          ir.founderCompany,
          String(ir.matchScore ?? ''),
          ir.status,
          ir.requestedAt.toISOString(),
          ir.respondedAt ? ir.respondedAt.toISOString() : '',
          String(ir.meetingScheduled),
        ]
          .map((x) => '"' + String(x).replace(/"/g, '""') + '"')
          .join(','),
      );
    }
    const csv = rows.join('\n');
    return new Response(csv, { headers: { 'Content-Type': 'text/csv' } });
  } catch (error: any) {
    console.error('Admin export error:', error);
    return NextResponse.json(
      { error: 'Failed to export', details: error.message },
      { status: 500 },
    );
  }
}
