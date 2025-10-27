/*
  Warnings:

  - You are about to drop the column `agentConfigurationId` on the `Chat` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Chat" DROP CONSTRAINT "Chat_agentConfigurationId_fkey";

-- AlterTable
ALTER TABLE "public"."Chat" DROP COLUMN "agentConfigurationId",
ADD COLUMN     "userAgentConfigurationId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Chat" ADD CONSTRAINT "Chat_userAgentConfigurationId_fkey" FOREIGN KEY ("userAgentConfigurationId") REFERENCES "public"."AgentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
