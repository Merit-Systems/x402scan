-- AlterTable: add method column with default
ALTER TABLE "Resources" ADD COLUMN "method" TEXT NOT NULL DEFAULT 'GET';

-- DropIndex: remove old single-column unique constraint
DROP INDEX "Resources_resource_key";

-- CreateIndex: add compound unique constraint on (resource, method)
CREATE UNIQUE INDEX "Resources_resource_method_key" ON "Resources"("resource", "method");
