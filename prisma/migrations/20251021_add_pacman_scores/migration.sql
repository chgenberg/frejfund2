-- CreateTable
CREATE TABLE IF NOT EXISTS "pacman_scores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "playerName" TEXT NOT NULL DEFAULT 'Anonymous',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "pacman_scores_sessionId_idx" ON "pacman_scores"("sessionId");
CREATE INDEX IF NOT EXISTS "pacman_scores_score_idx" ON "pacman_scores"("score");
CREATE INDEX IF NOT EXISTS "pacman_scores_createdAt_idx" ON "pacman_scores"("createdAt");

