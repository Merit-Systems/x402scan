/*
  Warnings:

  - A unique constraint covering the columns `[tx_hash,log_index,chain]` on the table `TransferEvent` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "TransferEvent" ADD COLUMN     "log_index" INTEGER;

-- CreateIndex
CREATE INDEX "TransferEvent_block_timestamp_idx" ON "TransferEvent"("block_timestamp");

-- CreateIndex
CREATE INDEX "TransferEvent_tx_hash_idx" ON "TransferEvent"("tx_hash");

-- CreateIndex
CREATE INDEX "TransferEvent_chain_block_timestamp_idx" ON "TransferEvent"("chain", "block_timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "TransferEvent_tx_hash_log_index_chain_key" ON "TransferEvent"("tx_hash", "log_index", "chain");
