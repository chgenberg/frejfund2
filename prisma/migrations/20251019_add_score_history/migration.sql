-- CreateTable
CREATE TABLE IF NOT EXISTS "score_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "dimension_id" TEXT NOT NULL,
    "dimension_name" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "overall_score" INTEGER,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "score_history_user_id_idx" ON "score_history"("user_id");
CREATE INDEX IF NOT EXISTS "score_history_session_id_idx" ON "score_history"("session_id");
CREATE INDEX IF NOT EXISTS "score_history_dimension_id_idx" ON "score_history"("dimension_id");
CREATE INDEX IF NOT EXISTS "score_history_recorded_at_idx" ON "score_history"("recorded_at");

