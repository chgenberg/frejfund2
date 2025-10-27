import { NextRequest, NextResponse } from 'next/server';
import { buildReadinessTree, summarizeReadinessTree } from '@/lib/readiness-tree-builder';

/**
 * GET /api/readiness-tree?sessionId=xxx
 * Get the investor readiness tree for a session
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    // Build readiness tree from deep analysis
    const tree = await buildReadinessTree(sessionId);
    const summary = summarizeReadinessTree(tree);

    return NextResponse.json({
      success: true,
      tree,
      summary,
    });
  } catch (error) {
    console.error('Error fetching readiness tree:', error);
    
    if (error instanceof Error && error.message.includes('No analysis found')) {
      return NextResponse.json(
        { error: 'No analysis found for this session. Please run analysis first.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch readiness tree' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/readiness-tree
 * Rebuild the readiness tree after updates
 */
export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    // Rebuild tree
    const tree = await buildReadinessTree(sessionId);
    const summary = summarizeReadinessTree(tree);

    return NextResponse.json({
      success: true,
      tree,
      summary,
      message: 'Readiness tree rebuilt successfully',
    });
  } catch (error) {
    console.error('Error building readiness tree:', error);
    return NextResponse.json(
      { error: 'Failed to build readiness tree' },
      { status: 500 }
    );
  }
}
