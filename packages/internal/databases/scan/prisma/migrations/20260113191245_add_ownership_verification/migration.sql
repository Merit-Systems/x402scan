-- Add ownership verification fields to Accepts table
ALTER TABLE "public"."Accepts"
ADD COLUMN "verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "verifiedAddress" TEXT,
ADD COLUMN "verificationProof" TEXT,
ADD COLUMN "verifiedAt" TIMESTAMP(3);

-- Add indexes for verification queries
CREATE INDEX "Accepts_verified_idx" ON "public"."Accepts"("verified");
CREATE INDEX "Accepts_resourceId_verified_idx" ON "public"."Accepts"("resourceId", "verified");
