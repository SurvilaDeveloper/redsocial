-- CreateTable
CREATE TABLE "rate_limit_bucket" (
    "scope" VARCHAR(100) NOT NULL,
    "subjectHash" CHAR(64) NOT NULL,
    "windowStartedAt" TIMESTAMPTZ(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "limitValue" INTEGER NOT NULL,
    "windowSeconds" INTEGER NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limit_bucket_pkey" PRIMARY KEY ("scope", "subjectHash")
);

-- CreateIndex
CREATE INDEX "rate_limit_bucket_expiresAt_idx" ON "rate_limit_bucket"("expiresAt");
