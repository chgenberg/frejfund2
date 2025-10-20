-- Add confidence-weighted scoring and data completeness tracking
ALTER TABLE "deep_analyses" ADD COLUMN IF NOT EXISTS "confidenceWeightedScore" INTEGER;
ALTER TABLE "deep_analyses" ADD COLUMN IF NOT EXISTS "dataCompleteness" INTEGER;
ALTER TABLE "deep_analyses" ADD COLUMN IF NOT EXISTS "companyStage" TEXT;

-- Add index for company stage filtering
CREATE INDEX IF NOT EXISTS "deep_analyses_companyStage_idx" ON "deep_analyses"("companyStage");

