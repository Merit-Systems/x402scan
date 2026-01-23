-- CreateTable
CREATE TABLE "BalanceCheck" (
    "id" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BalanceCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BalanceCheck_wallet_idx" ON "BalanceCheck"("wallet");

-- CreateIndex
CREATE INDEX "BalanceCheck_createdAt_idx" ON "BalanceCheck"("createdAt");

-- CreateIndex
CREATE INDEX "BalanceCheck_wallet_createdAt_idx" ON "BalanceCheck"("wallet", "createdAt");
