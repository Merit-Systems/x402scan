/*
  Warnings:

  - You are about to drop the column `p50AllMs` on the `DomainMetrics` table. All the data in the column will be lost.
  - You are about to drop the column `p90AllMs` on the `DomainMetrics` table. All the data in the column will be lost.
  - You are about to drop the column `p99AllMs` on the `DomainMetrics` table. All the data in the column will be lost.
  - You are about to drop the column `p50AllMs` on the `UrlMetrics` table. All the data in the column will be lost.
  - You are about to drop the column `p90AllMs` on the `UrlMetrics` table. All the data in the column will be lost.
  - You are about to drop the column `p99AllMs` on the `UrlMetrics` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DomainMetrics" DROP COLUMN "p50AllMs",
DROP COLUMN "p90AllMs",
DROP COLUMN "p99AllMs",
ADD COLUMN     "p50AllTimeMs" INTEGER,
ADD COLUMN     "p90AllTimeMs" INTEGER,
ADD COLUMN     "p99AllTimeMs" INTEGER;

-- AlterTable
ALTER TABLE "UrlMetrics" DROP COLUMN "p50AllMs",
DROP COLUMN "p90AllMs",
DROP COLUMN "p99AllMs",
ADD COLUMN     "p50AllTimeMs" INTEGER,
ADD COLUMN     "p90AllTimeMs" INTEGER,
ADD COLUMN     "p99AllTimeMs" INTEGER;
