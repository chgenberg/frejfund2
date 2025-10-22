-- AlterTable: add metricOverrides JSON column to deep_analyses
ALTER TABLE "deep_analyses" ADD COLUMN IF NOT EXISTS "metricOverrides" JSON;


