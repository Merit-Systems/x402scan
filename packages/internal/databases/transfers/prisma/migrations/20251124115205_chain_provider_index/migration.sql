-- CreateIndex
CREATE INDEX "TransferEvent_chain_transaction_from_provider_block_timest_idx" ON "TransferEvent"("chain", "transaction_from", "provider", "block_timestamp" DESC);
