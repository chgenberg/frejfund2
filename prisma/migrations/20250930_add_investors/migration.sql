-- CreateTable
CREATE TABLE "investors" (
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

-- CreateTable
CREATE TABLE "investor_matches" (
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

-- CreateIndex
CREATE INDEX "investors_firmName_idx" ON "investors"("firmName");

-- CreateIndex
CREATE INDEX "investors_stage_idx" ON "investors"("stage");

-- CreateIndex
CREATE INDEX "investors_geographies_idx" ON "investors"("geographies");

-- CreateIndex
CREATE INDEX "investor_matches_sessionId_idx" ON "investor_matches"("sessionId");

-- CreateIndex
CREATE INDEX "investor_matches_matchScore_idx" ON "investor_matches"("matchScore");

-- CreateIndex
CREATE INDEX "investor_matches_status_idx" ON "investor_matches"("status");

-- CreateIndex
CREATE UNIQUE INDEX "investor_matches_sessionId_investorId_key" ON "investor_matches"("sessionId", "investorId");

-- AddForeignKey
ALTER TABLE "investor_matches" ADD CONSTRAINT "investor_matches_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "investors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
