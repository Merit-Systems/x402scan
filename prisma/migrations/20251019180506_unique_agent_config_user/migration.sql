/*
  Warnings:

  - A unique constraint covering the columns `[userId,agentConfigurationId]` on the table `AgentUser` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."AgentUser" ADD COLUMN     "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "AgentUser_userId_agentConfigurationId_key" ON "public"."AgentUser"("userId", "agentConfigurationId");
