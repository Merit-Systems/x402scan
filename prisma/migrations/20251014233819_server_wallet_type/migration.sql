-- CreateEnum
CREATE TYPE "public"."ServerWalletType" AS ENUM ('CHAT', 'AGENT');

-- AlterTable
ALTER TABLE "public"."ServerWallet" ADD COLUMN     "type" "public"."ServerWalletType" NOT NULL DEFAULT 'CHAT';
