-- CreateIndex
CREATE INDEX "Accepts_payTo_idx" ON "Accepts"("payTo");

-- CreateIndex
CREATE INDEX "Accepts_payTo_network_idx" ON "Accepts"("payTo", "network");

-- CreateIndex
CREATE INDEX "Accepts_payTo_verified_idx" ON "Accepts"("payTo", "verified");
