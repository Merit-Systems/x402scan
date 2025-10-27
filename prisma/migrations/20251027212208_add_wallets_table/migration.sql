-- CreateTable
CREATE TABLE "public"."WalletSnapshot" (
    "accountName" TEXT NOT NULL,
    "accountAddress" TEXT NOT NULL,
    "amount" BIGINT NOT NULL DEFAULT 0,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletSnapshot_pkey" PRIMARY KEY ("accountAddress","timestamp")
);

-- CreateIndex
CREATE INDEX "WalletSnapshot_timestamp_idx" ON "public"."WalletSnapshot"("timestamp");
