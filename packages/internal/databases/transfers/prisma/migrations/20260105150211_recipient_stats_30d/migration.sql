-- Recipient stats materialized views for 30 days timeframe

-- Aggregated view
CREATE MATERIALIZED VIEW IF NOT EXISTS recipient_stats_aggregated_30d AS
WITH recent_transfers AS (
  SELECT *
  FROM "TransferEvent"
  WHERE "block_timestamp" >= NOW() - INTERVAL '30 days'
)
SELECT
  t."recipient",
  t."chain",
  ARRAY_AGG(DISTINCT t."facilitator_id") AS facilitator_ids,
  COUNT(*)::int AS total_transactions,
  COALESCE(SUM(t."amount"), 0)::float AS total_amount,
  COUNT(DISTINCT t."sender")::int AS unique_buyers,
  MAX(t."block_timestamp") AS latest_block_timestamp
FROM recent_transfers t
GROUP BY
  t."recipient",
  t."chain"
ORDER BY total_transactions DESC;

CREATE UNIQUE INDEX IF NOT EXISTS recipient_stats_aggregated_30d_idx
ON recipient_stats_aggregated_30d (recipient, chain);

-- Bucketed view
CREATE MATERIALIZED VIEW IF NOT EXISTS recipient_stats_bucketed_30d AS
WITH recent_transfers AS (
  SELECT *
  FROM "TransferEvent"
  WHERE "block_timestamp" >= NOW() - INTERVAL '30 days'
)
SELECT 
  time_bucket('15 hours', t."block_timestamp") AS bucket,
  t."recipient",
  t."chain",
  ARRAY_AGG(DISTINCT t."facilitator_id") AS facilitator_ids,
  COUNT(*)::int AS total_transactions,
  COALESCE(SUM(t."amount"), 0)::float AS total_amount,
  COUNT(DISTINCT t."sender")::int AS unique_buyers,
  MAX(t."block_timestamp") AS latest_block_timestamp
FROM recent_transfers t
GROUP BY
  bucket,
  t."recipient",
  t."chain";

CREATE UNIQUE INDEX IF NOT EXISTS recipient_stats_bucketed_30d_idx
ON recipient_stats_bucketed_30d (bucket, recipient, chain);
