-- Sender (buyer) stats materialized views for all-time (0d) timeframe

-- Aggregated view
CREATE MATERIALIZED VIEW IF NOT EXISTS sender_stats_aggregated_0d AS
SELECT
  t."sender",
  t."chain",
  ARRAY_AGG(DISTINCT t."facilitator_id") AS facilitator_ids,
  COUNT(*)::int AS total_transactions,
  COALESCE(SUM(t."amount"), 0)::float AS total_amount,
  COUNT(DISTINCT t."recipient")::int AS unique_sellers,
  MAX(t."block_timestamp") AS latest_block_timestamp
FROM "TransferEvent" t
GROUP BY
  t."sender",
  t."chain"
ORDER BY total_transactions DESC;

CREATE UNIQUE INDEX IF NOT EXISTS sender_stats_aggregated_0d_idx
ON sender_stats_aggregated_0d (sender, chain);

-- Bucketed view (daily buckets for all-time)
CREATE MATERIALIZED VIEW IF NOT EXISTS sender_stats_bucketed_0d AS
SELECT
  time_bucket('1 day', t."block_timestamp") AS bucket,
  t."sender",
  t."chain",
  COUNT(*)::int AS total_transactions,
  COALESCE(SUM(t."amount"), 0)::float AS total_amount,
  COUNT(DISTINCT t."recipient")::int AS unique_sellers,
  MAX(t."block_timestamp") AS latest_block_timestamp
FROM "TransferEvent" t
GROUP BY
  bucket,
  t."sender",
  t."chain";

CREATE UNIQUE INDEX IF NOT EXISTS sender_stats_bucketed_0d_idx
ON sender_stats_bucketed_0d (bucket, sender, chain);
