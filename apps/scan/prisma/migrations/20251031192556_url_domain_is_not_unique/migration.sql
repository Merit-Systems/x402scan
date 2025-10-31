-- DropIndex
DROP INDEX "public"."ResourceDomainMetrics_domain_key";

-- DropIndex
DROP INDEX "public"."ResourceUrlMetrics_url_key";

-- CreateIndex
CREATE INDEX "ResourceDomainMetrics_domain_idx" ON "ResourceDomainMetrics"("domain");

-- CreateIndex
CREATE INDEX "ResourceDomainMetrics_domain_createdAt_idx" ON "ResourceDomainMetrics"("domain", "createdAt");

-- CreateIndex
CREATE INDEX "ResourceUrlMetrics_url_idx" ON "ResourceUrlMetrics"("url");

-- CreateIndex
CREATE INDEX "ResourceUrlMetrics_url_createdAt_idx" ON "ResourceUrlMetrics"("url", "createdAt");
