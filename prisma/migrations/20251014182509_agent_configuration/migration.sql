/*
  Warnings:

  - The `visibility` column on the `Chat` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Message_v2` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."Visibility" AS ENUM ('public', 'private');

-- DropForeignKey
ALTER TABLE "public"."Message_v2" DROP CONSTRAINT "Message_v2_chatId_fkey";

-- AlterTable
ALTER TABLE "public"."Chat" DROP COLUMN "visibility",
ADD COLUMN     "visibility" "public"."Visibility" NOT NULL DEFAULT 'private';

-- DropTable
DROP TABLE "public"."Message_v2";

-- DropEnum
DROP TYPE "public"."ChatVisibility";

-- CreateTable
CREATE TABLE "public"."Message" (
    "Message" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "parts" JSONB NOT NULL,
    "attachments" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("Message")
);

-- CreateTable
CREATE TABLE "public"."AgentConfiguration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentConfig" JSONB NOT NULL,
    "visibility" "public"."Visibility" NOT NULL DEFAULT 'private',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentConfiguration_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgentConfiguration" ADD CONSTRAINT "AgentConfiguration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
