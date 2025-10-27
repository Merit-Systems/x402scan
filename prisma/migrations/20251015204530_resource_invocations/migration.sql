-- CreateTable
CREATE TABLE "public"."ResourceInvocation" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT,
    "statusCode" INTEGER NOT NULL,
    "statusText" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "requestContentType" TEXT NOT NULL,
    "responseContentType" TEXT NOT NULL,
    "responseHeaders" JSONB,
    "responseBody" JSONB,
    "requestHeaders" JSONB,
    "requestBody" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceInvocation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."ResourceInvocation" ADD CONSTRAINT "ResourceInvocation_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "public"."Resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;
