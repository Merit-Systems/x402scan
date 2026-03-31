-- Materialized view tracking the first transaction date for each sender
-- Used to compute "new buyers" metrics by joining with bucketed/aggregated MVs

CREATE MATERIALIZED VIEW IF NOT EXISTS sender_first_seen AS
SELECT
  sender,
  chain,
  MIN(block_timestamp) AS first_block_timestamp
FROM "TransferEvent"
GROUP BY sender, chain;

CREATE UNIQUE INDEX IF NOT EXISTS sender_first_seen_idx
ON sender_first_seen (sender, chain);

-- Index for efficient time-based queries (e.g., "new buyers in last 1 day")
CREATE INDEX IF NOT EXISTS sender_first_seen_timestamp_idx
ON sender_first_seen (first_block_timestamp);
