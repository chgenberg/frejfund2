-- CreateTable
CREATE TABLE "deep_analyses" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "overallScore" INTEGER,
    "investmentReadiness" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deep_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_dimensions" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "dimensionId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "score" INTEGER,
    "findings" TEXT[],
    "redFlags" TEXT[],
    "strengths" TEXT[],
    "evidence" TEXT[],
    "questions" TEXT[],
    "analyzed" BOOLEAN NOT NULL DEFAULT false,
    "analyzedAt" TIMESTAMP(3),
    "prompt" TEXT,
    "modelUsed" TEXT,
    "tokensUsed" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analysis_dimensions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_insights" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "recommendation" TEXT,
    "relatedDimensions" TEXT[],
    "evidence" TEXT[],
    "addressed" BOOLEAN NOT NULL DEFAULT false,
    "addressedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analysis_insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deep_analyses_sessionId_key" ON "deep_analyses"("sessionId");

-- CreateIndex
CREATE INDEX "deep_analyses_sessionId_idx" ON "deep_analyses"("sessionId");

-- CreateIndex
CREATE INDEX "deep_analyses_userId_idx" ON "deep_analyses"("userId");

-- CreateIndex
CREATE INDEX "deep_analyses_status_idx" ON "deep_analyses"("status");

-- CreateIndex
CREATE INDEX "analysis_dimensions_analysisId_idx" ON "analysis_dimensions"("analysisId");

-- CreateIndex
CREATE INDEX "analysis_dimensions_dimensionId_idx" ON "analysis_dimensions"("dimensionId");

-- CreateIndex
CREATE INDEX "analysis_dimensions_category_idx" ON "analysis_dimensions"("category");

-- CreateIndex
CREATE INDEX "analysis_insights_analysisId_idx" ON "analysis_insights"("analysisId");

-- CreateIndex
CREATE INDEX "analysis_insights_type_idx" ON "analysis_insights"("type");

-- CreateIndex
CREATE INDEX "analysis_insights_priority_idx" ON "analysis_insights"("priority");

-- AddForeignKey
ALTER TABLE "analysis_dimensions" ADD CONSTRAINT "analysis_dimensions_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "deep_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_insights" ADD CONSTRAINT "analysis_insights_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "deep_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
