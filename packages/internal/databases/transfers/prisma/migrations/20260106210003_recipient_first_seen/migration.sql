-- Materialized view tracking the first transaction date for each recipient
-- Used to compute "new sellers" metrics by joining with bucketed/aggregated MVs

CREATE MATERIALIZED VIEW IF NOT EXISTS recipient_first_seen AS
SELECT
  recipient,
  chain,
  MIN(block_timestamp) AS first_block_timestamp
FROM "TransferEvent"
GROUP BY recipient, chain;

CREATE UNIQUE INDEX IF NOT EXISTS recipient_first_seen_idx
ON recipient_first_seen (recipient, chain);

-- Index for efficient time-based queries (e.g., "new sellers in last 1 day")
CREATE INDEX IF NOT EXISTS recipient_first_seen_timestamp_idx
ON recipient_first_seen (first_block_timestamp);
