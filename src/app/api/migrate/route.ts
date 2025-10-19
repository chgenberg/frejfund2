import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

// POST /api/migrate - Run Prisma migrations (use with caution!)
export async function POST(req: NextRequest) {
  try {
    // Security: Only allow in development or with secret
    const secret = req.headers.get('x-migration-secret');
    const expectedSecret = process.env.MIGRATION_SECRET || 'dev-only-secret';

    if (secret !== expectedSecret) {
      return NextResponse.json(
        {
          error: 'Unauthorized - Migration secret required',
        },
        { status: 401 },
      );
    }

    console.log('🔄 Running Prisma migrations...');

    // Run prisma migrate deploy
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy');

    console.log('✅ Migration output:', stdout);
    if (stderr) console.error('⚠️  Migration stderr:', stderr);

    return NextResponse.json({
      success: true,
      output: stdout,
      message: 'Migrations completed successfully',
    });
  } catch (error: any) {
    console.error('❌ Migration error:', error);
    return NextResponse.json(
      {
        error: 'Migration failed',
        details: error.message,
        stdout: error.stdout,
        stderr: error.stderr,
      },
      { status: 500 },
    );
  }
}
