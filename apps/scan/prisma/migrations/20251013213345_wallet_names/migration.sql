-- CreateTable
CREATE TABLE "public"."ServerWallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServerWallet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServerWallet_userId_key" ON "public"."ServerWallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ServerWallet_walletName_key" ON "public"."ServerWallet"("walletName");

-- AddForeignKey
ALTER TABLE "public"."ServerWallet" ADD CONSTRAINT "ServerWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
