/*
  Warnings:

  - You are about to drop the `DomainMetrics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UrlMetrics` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."DomainMetrics";

-- DropTable
DROP TABLE "public"."UrlMetrics";

-- CreateTable
CREATE TABLE "ResourceDomainMetrics" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "totalCount1h" INTEGER,
    "totalCount6h" INTEGER,
    "totalCount24h" INTEGER,
    "totalCount3d" INTEGER,
    "totalCount7d" INTEGER,
    "totalCount15d" INTEGER,
    "totalCount30d" INTEGER,
    "totalCountAllTime" INTEGER,
    "uptime1hPct" DOUBLE PRECISION,
    "uptime6hPct" DOUBLE PRECISION,
    "uptime24hPct" DOUBLE PRECISION,
    "uptime3dPct" DOUBLE PRECISION,
    "uptime7dPct" DOUBLE PRECISION,
    "uptime15dPct" DOUBLE PRECISION,
    "uptime30dPct" DOUBLE PRECISION,
    "uptimeAllTimePct" DOUBLE PRECISION,
    "p50_1hMs" INTEGER,
    "p50_6hMs" INTEGER,
    "p50_24hMs" INTEGER,
    "p50_3dMs" INTEGER,
    "p50_7dMs" INTEGER,
    "p50_15dMs" INTEGER,
    "p50_30dMs" INTEGER,
    "p50AllTimeMs" INTEGER,
    "p90_1hMs" INTEGER,
    "p90_6hMs" INTEGER,
    "p90_24hMs" INTEGER,
    "p90_3dMs" INTEGER,
    "p90_7dMs" INTEGER,
    "p90_15dMs" INTEGER,
    "p90_30dMs" INTEGER,
    "p90AllTimeMs" INTEGER,
    "p99_1hMs" INTEGER,
    "p99_6hMs" INTEGER,
    "p99_24hMs" INTEGER,
    "p99_3dMs" INTEGER,
    "p99_7dMs" INTEGER,
    "p99_15dMs" INTEGER,
    "p99_30dMs" INTEGER,
    "p99AllTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceDomainMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceUrlMetrics" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "totalCount1h" INTEGER,
    "totalCount6h" INTEGER,
    "totalCount24h" INTEGER,
    "totalCount3d" INTEGER,
    "totalCount7d" INTEGER,
    "totalCount15d" INTEGER,
    "totalCount30d" INTEGER,
    "totalCountAllTime" INTEGER,
    "uptime1hPct" DOUBLE PRECISION,
    "uptime6hPct" DOUBLE PRECISION,
    "uptime24hPct" DOUBLE PRECISION,
    "uptime3dPct" DOUBLE PRECISION,
    "uptime7dPct" DOUBLE PRECISION,
    "uptime15dPct" DOUBLE PRECISION,
    "uptime30dPct" DOUBLE PRECISION,
    "uptimeAllTimePct" DOUBLE PRECISION,
    "p50_1hMs" INTEGER,
    "p50_6hMs" INTEGER,
    "p50_24hMs" INTEGER,
    "p50_3dMs" INTEGER,
    "p50_7dMs" INTEGER,
    "p50_15dMs" INTEGER,
    "p50_30dMs" INTEGER,
    "p50AllTimeMs" INTEGER,
    "p90_1hMs" INTEGER,
    "p90_6hMs" INTEGER,
    "p90_24hMs" INTEGER,
    "p90_3dMs" INTEGER,
    "p90_7dMs" INTEGER,
    "p90_15dMs" INTEGER,
    "p90_30dMs" INTEGER,
    "p90AllTimeMs" INTEGER,
    "p99_1hMs" INTEGER,
    "p99_6hMs" INTEGER,
    "p99_24hMs" INTEGER,
    "p99_3dMs" INTEGER,
    "p99_7dMs" INTEGER,
    "p99_15dMs" INTEGER,
    "p99_30dMs" INTEGER,
    "p99AllTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceUrlMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResourceDomainMetrics_domain_key" ON "ResourceDomainMetrics"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceUrlMetrics_url_key" ON "ResourceUrlMetrics"("url");
