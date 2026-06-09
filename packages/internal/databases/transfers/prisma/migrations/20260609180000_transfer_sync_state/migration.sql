CREATE TABLE "TransferSyncState" (
    "id" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "facilitator_id" TEXT NOT NULL,
    "transaction_from" TEXT NOT NULL,
    "token_address" TEXT NOT NULL,
    "cursor_timestamp" TIMESTAMP(3) NOT NULL,
    "last_started_at" TIMESTAMP(3),
    "last_completed_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransferSyncState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TransferSyncState_chain_provider_facilitator_id_transaction_key" ON "TransferSyncState"("chain", "provider", "facilitator_id", "transaction_from", "token_address");

CREATE INDEX "TransferSyncState_chain_provider_cursor_timestamp_idx" ON "TransferSyncState"("chain", "provider", "cursor_timestamp");
