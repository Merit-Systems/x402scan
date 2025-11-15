-- Preparing the db for hypertable
ALTER TABLE "TransferEvent" DROP CONSTRAINT "TransferEvent_pkey";
ALTER TABLE "TransferEvent"
ADD CONSTRAINT transfer_event_pk PRIMARY KEY (block_timestamp, id);
DROP INDEX IF EXISTS "TransferEvent_tx_hash_log_index_chain_key";
CREATE UNIQUE INDEX "TransferEvent_tx_hash_log_index_chain_block_timestamp_key"
ON "TransferEvent" ("tx_hash", "log_index", "chain", "block_timestamp");