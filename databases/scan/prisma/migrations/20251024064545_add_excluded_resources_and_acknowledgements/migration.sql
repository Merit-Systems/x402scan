-- CreateTable
CREATE TABLE "public"."ExcludedResource" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,

    CONSTRAINT "ExcludedResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserAcknowledgement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "acknowledgedComposerAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAcknowledgement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExcludedResource_resourceId_key" ON "public"."ExcludedResource"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAcknowledgement_userId_key" ON "public"."UserAcknowledgement"("userId");

-- AddForeignKey
ALTER TABLE "public"."ExcludedResource" ADD CONSTRAINT "ExcludedResource_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "public"."Resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserAcknowledgement" ADD CONSTRAINT "UserAcknowledgement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
