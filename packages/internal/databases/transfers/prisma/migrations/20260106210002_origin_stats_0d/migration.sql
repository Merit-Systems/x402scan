-- All-time (0d) origin stats materialized views

-- Aggregated view
CREATE MATERIALIZED VIEW IF NOT EXISTS origin_stats_aggregated_0d AS
SELECT 
  m."originId",
  t."chain",
  ARRAY_AGG(DISTINCT t."facilitator_id") AS facilitator_ids,
  ARRAY_AGG(DISTINCT m."payTo") AS payto_addresses,
  COUNT(*)::int AS total_transactions,
  COALESCE(SUM(t."amount"), 0)::float AS total_amount,
  COUNT(DISTINCT t."sender")::int AS unique_buyers,
  MAX(t."block_timestamp") AS latest_block_timestamp
FROM "TransferEvent" t
JOIN payto_origin_map m
  ON t."recipient" = m."payTo"
GROUP BY
  m."originId",
  t."chain"
ORDER BY total_transactions DESC;

CREATE UNIQUE INDEX IF NOT EXISTS origin_stats_aggregated_0d_idx
ON origin_stats_aggregated_0d ("originId", chain);

-- Bucketed view with 1-day buckets for all-time data
CREATE MATERIALIZED VIEW IF NOT EXISTS origin_stats_bucketed_0d AS
SELECT 
  time_bucket('1 day', t."block_timestamp") AS bucket,
  m."originId",
  t."chain",
  COUNT(*)::int AS total_transactions,
  COALESCE(SUM(t."amount"), 0)::float AS total_amount,
  COUNT(DISTINCT t."sender")::int AS unique_buyers,
  MAX(t."block_timestamp") AS latest_block_timestamp
FROM "TransferEvent" t
JOIN payto_origin_map m
  ON t."recipient" = m."payTo"
GROUP BY
  bucket,
  m."originId",
  t."chain";

CREATE UNIQUE INDEX IF NOT EXISTS origin_stats_bucketed_0d_idx
ON origin_stats_bucketed_0d (bucket, "originId", chain);
