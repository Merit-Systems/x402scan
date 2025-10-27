-- AlterTable
ALTER TABLE "public"."OnrampSession" ADD COLUMN     "serverWalletId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."OnrampSession" ADD CONSTRAINT "OnrampSession_serverWalletId_fkey" FOREIGN KEY ("serverWalletId") REFERENCES "public"."ServerWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
