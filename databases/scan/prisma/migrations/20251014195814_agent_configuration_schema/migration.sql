/*
  Warnings:

  - You are about to drop the column `agentConfig` on the `AgentConfiguration` table. All the data in the column will be lost.
  - Added the required column `model` to the `AgentConfiguration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `systemPrompt` to the `AgentConfiguration` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."AgentConfiguration" DROP COLUMN "agentConfig",
ADD COLUMN     "model" TEXT NOT NULL,
ADD COLUMN     "systemPrompt" TEXT NOT NULL,
ADD COLUMN     "tools" TEXT[];

-- CreateTable
CREATE TABLE "public"."Schedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Schedule" ADD CONSTRAINT "Schedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
