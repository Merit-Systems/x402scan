-- CreateTable
CREATE TABLE "McpUser" (
    "id" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "name" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "McpUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "McpUser_wallet_key" ON "McpUser"("wallet");

-- CreateIndex
CREATE INDEX "McpUser_wallet_idx" ON "McpUser"("wallet");
