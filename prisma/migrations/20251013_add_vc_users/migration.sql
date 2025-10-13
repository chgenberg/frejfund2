-- CreateTable
CREATE TABLE "vc_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "firm" TEXT,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "industries" TEXT[],
    "stages" TEXT[],
    "minCheckSize" INTEGER,
    "maxCheckSize" INTEGER,
    "geographies" TEXT[]
);

-- CreateIndex
CREATE UNIQUE INDEX "vc_users_email_key" ON "vc_users"("email");

