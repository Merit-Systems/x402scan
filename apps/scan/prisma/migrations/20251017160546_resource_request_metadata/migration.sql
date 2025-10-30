-- CreateTable
CREATE TABLE "public"."ResourceRequestMetadata" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "headers" JSONB NOT NULL,
    "body" JSONB NOT NULL,
    "queryParams" JSONB NOT NULL,
    "inputSchema" JSONB NOT NULL,

    CONSTRAINT "ResourceRequestMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResourceRequestMetadata_resourceId_key" ON "public"."ResourceRequestMetadata"("resourceId");

-- AddForeignKey
ALTER TABLE "public"."ResourceRequestMetadata" ADD CONSTRAINT "ResourceRequestMetadata_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "public"."Resources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
