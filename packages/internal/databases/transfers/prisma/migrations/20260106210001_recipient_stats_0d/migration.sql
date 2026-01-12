-- All-time (0d) recipient stats materialized views

-- Aggregated view
CREATE MATERIALIZED VIEW IF NOT EXISTS recipient_stats_aggregated_0d AS
SELECT
  t."recipient",
  t."chain",
  ARRAY_AGG(DISTINCT t."facilitator_id") AS facilitator_ids,
  COUNT(*)::int AS total_transactions,
  COALESCE(SUM(t."amount"), 0)::float AS total_amount,
  COUNT(DISTINCT t."sender")::int AS unique_buyers,
  MAX(t."block_timestamp") AS latest_block_timestamp
FROM "TransferEvent" t
GROUP BY
  t."recipient",
  t."chain"
ORDER BY total_transactions DESC;

CREATE UNIQUE INDEX IF NOT EXISTS recipient_stats_aggregated_0d_idx
ON recipient_stats_aggregated_0d (recipient, chain);

-- Bucketed view with 1-day buckets for all-time data
CREATE MATERIALIZED VIEW IF NOT EXISTS recipient_stats_bucketed_0d AS
SELECT 
  time_bucket('1 day', t."block_timestamp") AS bucket,
  t."recipient",
  t."chain",
  COUNT(*)::int AS total_transactions,
  COALESCE(SUM(t."amount"), 0)::float AS total_amount,
  COUNT(DISTINCT t."sender")::int AS unique_buyers,
  MAX(t."block_timestamp") AS latest_block_timestamp
FROM "TransferEvent" t
GROUP BY
  bucket,
  t."recipient",
  t."chain";

CREATE UNIQUE INDEX IF NOT EXISTS recipient_stats_bucketed_0d_idx
ON recipient_stats_bucketed_0d (bucket, recipient, chain);
