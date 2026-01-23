-- Sender (buyer) stats materialized views for 30 days timeframe

-- Aggregated view
CREATE MATERIALIZED VIEW IF NOT EXISTS sender_stats_aggregated_30d AS
WITH recent_transfers AS (
  SELECT *
  FROM "TransferEvent"
  WHERE "block_timestamp" >= NOW() - INTERVAL '30 days'
)
SELECT
  t."sender",
  t."chain",
  ARRAY_AGG(DISTINCT t."facilitator_id") AS facilitator_ids,
  COUNT(*)::int AS total_transactions,
  COALESCE(SUM(t."amount"), 0)::float AS total_amount,
  COUNT(DISTINCT t."recipient")::int AS unique_sellers,
  MAX(t."block_timestamp") AS latest_block_timestamp
FROM recent_transfers t
GROUP BY
  t."sender",
  t."chain"
ORDER BY total_transactions DESC;

CREATE UNIQUE INDEX IF NOT EXISTS sender_stats_aggregated_30d_idx
ON sender_stats_aggregated_30d (sender, chain);

-- Bucketed view
CREATE MATERIALIZED VIEW IF NOT EXISTS sender_stats_bucketed_30d AS
WITH recent_transfers AS (
  SELECT *
  FROM "TransferEvent"
  WHERE "block_timestamp" >= NOW() - INTERVAL '30 days'
)
SELECT
  time_bucket('15 hours', t."block_timestamp") AS bucket,
  t."sender",
  t."chain",
  COUNT(*)::int AS total_transactions,
  COALESCE(SUM(t."amount"), 0)::float AS total_amount,
  COUNT(DISTINCT t."recipient")::int AS unique_sellers,
  MAX(t."block_timestamp") AS latest_block_timestamp
FROM recent_transfers t
GROUP BY
  bucket,
  t."sender",
  t."chain";

CREATE UNIQUE INDEX IF NOT EXISTS sender_stats_bucketed_30d_idx
ON sender_stats_bucketed_30d (bucket, sender, chain);
