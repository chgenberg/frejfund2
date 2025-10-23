-- Create investment_ads table
CREATE TABLE "investment_ads" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "analysisId" TEXT,

  -- Display
  "title" TEXT NOT NULL,
  "oneLiner" TEXT,
  "summary" TEXT,
  "pros" TEXT[],
  "cons" TEXT[],
  "highlights" TEXT[],

  -- Company info
  "companyName" TEXT NOT NULL,
  "industry" TEXT,
  "stage" TEXT,
  "location" TEXT,
  "website" TEXT,
  "pitchDeck" TEXT,

  -- Fundraising
  "seekingUsd" INTEGER,
  "valuationUsd" INTEGER,

  -- Metrics snapshot
  "metrics" JSONB,

  -- Publication
  "status" TEXT NOT NULL DEFAULT 'published',
  "isPublic" BOOLEAN NOT NULL DEFAULT TRUE,
  "publishedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Timestamps
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Foreign keys
ALTER TABLE "investment_ads"
  ADD CONSTRAINT "investment_ads_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "investment_ads"
  ADD CONSTRAINT "investment_ads_analysisId_fkey"
  FOREIGN KEY ("analysisId") REFERENCES "deep_analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "investment_ads_status_idx" ON "investment_ads"("status");
CREATE INDEX "investment_ads_publishedAt_idx" ON "investment_ads"("publishedAt");
CREATE INDEX "investment_ads_industry_idx" ON "investment_ads"("industry");
CREATE INDEX "investment_ads_stage_idx" ON "investment_ads"("stage");


