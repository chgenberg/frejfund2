-- CreateTable
CREATE TABLE IF NOT EXISTS "google_search_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "cached" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "google_search_logs_userId_idx" ON "google_search_logs"("userId");
CREATE INDEX IF NOT EXISTS "google_search_logs_createdAt_idx" ON "google_search_logs"("createdAt");

