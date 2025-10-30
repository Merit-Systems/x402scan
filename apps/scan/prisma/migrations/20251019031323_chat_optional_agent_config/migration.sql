-- AlterTable
ALTER TABLE "public"."Chat" ADD COLUMN     "agentConfigurationId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Chat" ADD CONSTRAINT "Chat_agentConfigurationId_fkey" FOREIGN KEY ("agentConfigurationId") REFERENCES "public"."AgentConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
