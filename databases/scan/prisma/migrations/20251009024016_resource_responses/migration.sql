-- CreateTable
CREATE TABLE "public"."ResourceResponse" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "response" JSONB NOT NULL,

    CONSTRAINT "ResourceResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResourceResponse_resourceId_key" ON "public"."ResourceResponse"("resourceId");

-- AddForeignKey
ALTER TABLE "public"."ResourceResponse" ADD CONSTRAINT "ResourceResponse_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "public"."Resources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
