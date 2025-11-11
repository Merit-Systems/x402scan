-- AlterTable
ALTER TABLE "ResourceMetrics" ADD COLUMN     "count_2xx_7d" INTEGER,
ADD COLUMN     "count_3xx_7d" INTEGER,
ADD COLUMN     "count_4xx_7d" INTEGER,
ADD COLUMN     "count_5xx_7d" INTEGER;

-- AlterTable
ALTER TABLE "ResourceOriginMetrics" ADD COLUMN     "count_2xx_7d" INTEGER,
ADD COLUMN     "count_3xx_7d" INTEGER,
ADD COLUMN     "count_4xx_7d" INTEGER,
ADD COLUMN     "count_5xx_7d" INTEGER;
