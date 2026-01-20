-- CreateEnum
CREATE TYPE "InviteCodeStatus" AS ENUM ('ACTIVE', 'EXHAUSTED', 'EXPIRED', 'DISABLED');

-- CreateEnum
CREATE TYPE "RedemptionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "InviteCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "maxRedemptions" INTEGER NOT NULL DEFAULT 1,
    "redemptionCount" INTEGER NOT NULL DEFAULT 0,
    "uniqueRecipients" BOOLEAN NOT NULL DEFAULT false,
    "status" "InviteCodeStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InviteCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InviteRedemption" (
    "id" TEXT NOT NULL,
    "inviteCodeId" TEXT NOT NULL,
    "recipientAddr" TEXT NOT NULL,
    "txHash" TEXT,
    "amount" BIGINT NOT NULL,
    "status" "RedemptionStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "InviteRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InviteCode_code_key" ON "InviteCode"("code");

-- CreateIndex
CREATE INDEX "InviteCode_code_idx" ON "InviteCode"("code");

-- CreateIndex
CREATE INDEX "InviteCode_status_idx" ON "InviteCode"("status");

-- CreateIndex
CREATE INDEX "InviteRedemption_inviteCodeId_idx" ON "InviteRedemption"("inviteCodeId");

-- CreateIndex
CREATE INDEX "InviteRedemption_recipientAddr_idx" ON "InviteRedemption"("recipientAddr");

-- AddForeignKey
ALTER TABLE "InviteCode" ADD CONSTRAINT "InviteCode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteRedemption" ADD CONSTRAINT "InviteRedemption_inviteCodeId_fkey" FOREIGN KEY ("inviteCodeId") REFERENCES "InviteCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
