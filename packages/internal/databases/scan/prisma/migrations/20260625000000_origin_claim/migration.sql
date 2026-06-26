-- CreateTable
CREATE TABLE "OriginClaimCode" (
    "id" TEXT NOT NULL,
    "originId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "linkTokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMP(3),
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OriginClaimCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OriginClaimSession" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OriginClaimSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OriginOwnership" (
    "id" TEXT NOT NULL,
    "originId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OriginOwnership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OriginClaimCode_linkTokenHash_key" ON "OriginClaimCode"("linkTokenHash");

-- CreateIndex
CREATE INDEX "OriginClaimCode_originId_idx" ON "OriginClaimCode"("originId");

-- CreateIndex
CREATE INDEX "OriginClaimCode_originId_createdAt_idx" ON "OriginClaimCode"("originId", "createdAt");

-- CreateIndex
CREATE INDEX "OriginClaimCode_email_createdAt_idx" ON "OriginClaimCode"("email", "createdAt");

-- CreateIndex
CREATE INDEX "OriginClaimCode_expiresAt_idx" ON "OriginClaimCode"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "OriginClaimSession_token_key" ON "OriginClaimSession"("token");

-- CreateIndex
CREATE INDEX "OriginClaimSession_email_idx" ON "OriginClaimSession"("email");

-- CreateIndex
CREATE INDEX "OriginClaimSession_expiresAt_idx" ON "OriginClaimSession"("expiresAt");

-- CreateIndex
CREATE INDEX "OriginOwnership_originId_idx" ON "OriginOwnership"("originId");

-- CreateIndex
CREATE INDEX "OriginOwnership_email_idx" ON "OriginOwnership"("email");

-- CreateIndex
CREATE UNIQUE INDEX "OriginOwnership_originId_email_key" ON "OriginOwnership"("originId", "email");

-- AddForeignKey
ALTER TABLE "OriginClaimCode" ADD CONSTRAINT "OriginClaimCode_originId_fkey" FOREIGN KEY ("originId") REFERENCES "ResourceOrigin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OriginOwnership" ADD CONSTRAINT "OriginOwnership_originId_fkey" FOREIGN KEY ("originId") REFERENCES "ResourceOrigin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
