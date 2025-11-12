-- CreateEnum
CREATE TYPE "public"."SessionStatus" AS ENUM ('ONRAMP_TRANSACTION_STATUS_IN_PROGRESS', 'ONRAMP_TRANSACTION_STATUS_SUCCESS', 'ONRAMP_TRANSACTION_STATUS_FAILED');

-- CreateTable
CREATE TABLE "public"."OnrampSession" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txHash" TEXT,
    "failureReason" TEXT,
    "status" "public"."SessionStatus" NOT NULL DEFAULT 'ONRAMP_TRANSACTION_STATUS_IN_PROGRESS',

    CONSTRAINT "OnrampSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnrampSession_token_key" ON "public"."OnrampSession"("token");

-- CreateIndex
CREATE UNIQUE INDEX "OnrampSession_txHash_key" ON "public"."OnrampSession"("txHash");

-- AddForeignKey
ALTER TABLE "public"."OnrampSession" ADD CONSTRAINT "OnrampSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
