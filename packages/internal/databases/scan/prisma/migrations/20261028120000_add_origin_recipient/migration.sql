-- CreateTable
CREATE TABLE "OriginRecipient" (
    "id" TEXT NOT NULL,
    "originId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "proof" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OriginRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OriginRecipient_address_idx" ON "OriginRecipient"("address");

-- CreateIndex
CREATE UNIQUE INDEX "OriginRecipient_originId_address_key" ON "OriginRecipient"("originId", "address");

-- AddForeignKey
ALTER TABLE "OriginRecipient" ADD CONSTRAINT "OriginRecipient_originId_fkey" FOREIGN KEY ("originId") REFERENCES "ResourceOrigin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
