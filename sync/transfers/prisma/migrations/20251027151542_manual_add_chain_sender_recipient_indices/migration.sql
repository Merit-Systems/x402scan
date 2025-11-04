-- Indices created manually with CONCURRENTLY in production database
-- Already exist:
-- - TransferEvent_chain_block_timestamp_facilitator_id_idx
-- - TransferEvent_sender_idx
-- - TransferEvent_recipient_idx

-- Index 1: Triple composite (chain + timestamp + facilitator)
-- CREATE INDEX CONCURRENTLY "TransferEvent_chain_block_timestamp_facilitator_id_idx" 
-- ON "TransferEvent"("chain", "block_timestamp", "facilitator_id");

-- Index 2: Sender
-- CREATE INDEX CONCURRENTLY "TransferEvent_sender_idx" 
-- ON "TransferEvent"("sender");

-- Index 3: Recipient  
-- CREATE INDEX CONCURRENTLY "TransferEvent_recipient_idx"
-- ON "TransferEvent"("recipient");