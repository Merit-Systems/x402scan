-- CreateTable
CREATE TABLE "TransferEvent" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "transaction_from" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "block_timestamp" TIMESTAMP(3) NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL,
    "facilitator_id" TEXT NOT NULL,
    "log_index" INTEGER,

    CONSTRAINT "TransferEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransferEvent_block_timestamp_idx" ON "TransferEvent"("block_timestamp");

-- CreateIndex
CREATE INDEX "TransferEvent_tx_hash_idx" ON "TransferEvent"("tx_hash");

-- CreateIndex
CREATE INDEX "TransferEvent_chain_block_timestamp_idx" ON "TransferEvent"("chain", "block_timestamp");

-- CreateIndex
CREATE INDEX "TransferEvent_block_timestamp_facilitator_id_idx" ON "TransferEvent"("block_timestamp", "facilitator_id");

-- CreateIndex
CREATE INDEX "TransferEvent_chain_block_timestamp_facilitator_id_idx" ON "TransferEvent"("chain", "block_timestamp", "facilitator_id");

-- CreateIndex
CREATE INDEX "TransferEvent_sender_idx" ON "TransferEvent"("sender");

-- CreateIndex
CREATE INDEX "TransferEvent_recipient_idx" ON "TransferEvent"("recipient");

-- CreateIndex
CREATE INDEX "TransferEvent_block_timestamp_brin_idx" ON "TransferEvent" USING BRIN ("block_timestamp");

-- CreateIndex
CREATE INDEX "TransferEvent_facilitator_block_timestamp_desc_idx" ON "TransferEvent"("facilitator_id", "block_timestamp" DESC);

-- CreateIndex
CREATE INDEX "TransferEvent_recipient_block_timestamp_idx" ON "TransferEvent"("recipient", "block_timestamp");

-- CreateIndex
CREATE INDEX "TransferEvent_recipient_sender_ts_idx" ON "TransferEvent"("recipient", "sender", "block_timestamp");

-- CreateIndex
CREATE INDEX "TransferEvent_sender_block_timestamp_idx" ON "TransferEvent"("sender", "block_timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "TransferEvent_tx_hash_log_index_chain_key" ON "TransferEvent"("tx_hash", "log_index", "chain");

