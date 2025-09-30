import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/db/setup - Setup database tables (run once)
export async function POST(req: NextRequest) {
  try {
    console.log('🔄 Setting up database...');

    // Run raw SQL to create tables if they don't exist
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "generated_documents" (
        "id" TEXT NOT NULL,
        "sessionId" TEXT NOT NULL,
        "userId" TEXT,
        "type" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "status" TEXT NOT NULL DEFAULT 'draft',
        "version" TEXT,
        "content" JSONB,
        "fileUrl" TEXT,
        "shareUrl" TEXT,
        "viewCount" INTEGER NOT NULL DEFAULT 0,
        "shareCount" INTEGER NOT NULL DEFAULT 0,
        "avgViewTime" INTEGER,
        "metadata" JSONB,
        "generatedBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "publishedAt" TIMESTAMP(3),
        CONSTRAINT "generated_documents_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "generated_documents_sessionId_idx" ON "generated_documents"("sessionId");
      CREATE INDEX IF NOT EXISTS "generated_documents_userId_idx" ON "generated_documents"("userId");
      CREATE INDEX IF NOT EXISTS "generated_documents_type_idx" ON "generated_documents"("type");
      CREATE INDEX IF NOT EXISTS "generated_documents_status_idx" ON "generated_documents"("status");
      CREATE INDEX IF NOT EXISTS "generated_documents_createdAt_idx" ON "generated_documents"("createdAt");
    `);

    console.log('✅ generated_documents table created');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "investors" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "firmName" TEXT,
        "type" TEXT NOT NULL,
        "email" TEXT,
        "linkedIn" TEXT,
        "twitter" TEXT,
        "website" TEXT,
        "stage" TEXT[],
        "industries" TEXT[],
        "geographies" TEXT[],
        "checkSizeMin" INTEGER,
        "checkSizeMax" INTEGER,
        "thesis" TEXT,
        "sweetSpot" TEXT,
        "portfolioCount" INTEGER NOT NULL DEFAULT 0,
        "notableInvestments" TEXT[],
        "fundSize" INTEGER,
        "yearFounded" INTEGER,
        "dealsPerYear" INTEGER,
        "tags" TEXT[],
        "ranking" INTEGER,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "investors_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "investors_firmName_idx" ON "investors"("firmName");
      CREATE INDEX IF NOT EXISTS "investors_stage_idx" ON "investors"("stage");
      CREATE INDEX IF NOT EXISTS "investors_geographies_idx" ON "investors"("geographies");
    `);

    console.log('✅ investors table created');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "investor_matches" (
        "id" TEXT NOT NULL,
        "sessionId" TEXT NOT NULL,
        "investorId" TEXT NOT NULL,
        "matchScore" INTEGER NOT NULL,
        "reasoning" TEXT NOT NULL,
        "stageMatch" INTEGER NOT NULL,
        "industryMatch" INTEGER NOT NULL,
        "geoMatch" INTEGER NOT NULL,
        "checkSizeMatch" INTEGER NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'suggested',
        "notes" TEXT,
        "contactedAt" TIMESTAMP(3),
        "respondedAt" TIMESTAMP(3),
        "hasWarmIntro" BOOLEAN NOT NULL DEFAULT false,
        "introPath" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "investor_matches_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "investor_matches_sessionId_idx" ON "investor_matches"("sessionId");
      CREATE INDEX IF NOT EXISTS "investor_matches_matchScore_idx" ON "investor_matches"("matchScore");
      CREATE INDEX IF NOT EXISTS "investor_matches_status_idx" ON "investor_matches"("status");
      CREATE UNIQUE INDEX IF NOT EXISTS "investor_matches_sessionId_investorId_key" ON "investor_matches"("sessionId", "investorId");
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "investor_matches" ADD CONSTRAINT "investor_matches_investorId_fkey" 
        FOREIGN KEY ("investorId") REFERENCES "investors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log('✅ investor_matches table created');

    return NextResponse.json({ 
      success: true,
      message: 'Database setup completed successfully',
      tables: ['generated_documents', 'investors', 'investor_matches']
    });
  } catch (error: any) {
    console.error('❌ Database setup error:', error);
    return NextResponse.json({ 
      error: 'Database setup failed',
      details: error.message
    }, { status: 500 });
  }
}
