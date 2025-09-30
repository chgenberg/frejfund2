-- CreateTable
CREATE TABLE "generated_documents" (
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

-- CreateIndex
CREATE INDEX "generated_documents_sessionId_idx" ON "generated_documents"("sessionId");

-- CreateIndex
CREATE INDEX "generated_documents_userId_idx" ON "generated_documents"("userId");

-- CreateIndex
CREATE INDEX "generated_documents_type_idx" ON "generated_documents"("type");

-- CreateIndex
CREATE INDEX "generated_documents_status_idx" ON "generated_documents"("status");

-- CreateIndex
CREATE INDEX "generated_documents_createdAt_idx" ON "generated_documents"("createdAt");
