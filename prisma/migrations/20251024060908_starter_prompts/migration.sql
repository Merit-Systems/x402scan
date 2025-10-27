-- AlterTable
ALTER TABLE "public"."AgentConfiguration" ADD COLUMN     "starterPrompts" TEXT[] DEFAULT ARRAY[]::TEXT[];
