/*
  Warnings:

  - You are about to drop the column `tools` on the `AgentConfiguration` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `AgentConfiguration` table. All the data in the column will be lost.
  - Added the required column `name` to the `AgentConfiguration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerId` to the `AgentConfiguration` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."AgentConfiguration" DROP CONSTRAINT "AgentConfiguration_userId_fkey";

-- AlterTable
ALTER TABLE "public"."AgentConfiguration" DROP COLUMN "tools",
DROP COLUMN "userId",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "ownerId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."AgentConfigurationResource" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "agentConfigurationId" TEXT NOT NULL,

    CONSTRAINT "AgentConfigurationResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AgentUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentConfigurationId" TEXT NOT NULL,

    CONSTRAINT "AgentUser_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."AgentConfiguration" ADD CONSTRAINT "AgentConfiguration_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgentConfigurationResource" ADD CONSTRAINT "AgentConfigurationResource_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "public"."Resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgentConfigurationResource" ADD CONSTRAINT "AgentConfigurationResource_agentConfigurationId_fkey" FOREIGN KEY ("agentConfigurationId") REFERENCES "public"."AgentConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgentUser" ADD CONSTRAINT "AgentUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgentUser" ADD CONSTRAINT "AgentUser_agentConfigurationId_fkey" FOREIGN KEY ("agentConfigurationId") REFERENCES "public"."AgentConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
