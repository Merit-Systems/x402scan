-- CreateTable
CREATE TABLE "Uptime" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "totalCount24h" INTEGER NOT NULL,
    "uptime1hPct" DOUBLE PRECISION,
    "uptime6hPct" DOUBLE PRECISION,
    "uptime24hPct" DOUBLE PRECISION,
    "uptimeAllTimePct" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Uptime_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Uptime_url_key" ON "Uptime"("url");
