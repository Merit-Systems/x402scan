-- CreateTable
CREATE TABLE "public"."ToolCall" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chatId" TEXT NOT NULL,

    CONSTRAINT "ToolCall_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."ToolCall" ADD CONSTRAINT "ToolCall_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "public"."Resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ToolCall" ADD CONSTRAINT "ToolCall_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
