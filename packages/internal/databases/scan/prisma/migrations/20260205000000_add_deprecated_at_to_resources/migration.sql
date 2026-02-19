-- AlterTable
ALTER TABLE "Resources" ADD COLUMN "deprecatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Resources_deprecatedAt_idx" ON "Resources"("deprecatedAt");
