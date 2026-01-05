-- Origin stats materialized views for 30 days timeframe

-- Aggregated view
CREATE MATERIALIZED VIEW IF NOT EXISTS origin_stats_aggregated_30d AS
WITH recent_transfers AS (
  SELECT *
  FROM "TransferEvent"
  WHERE "block_timestamp" >= NOW() - INTERVAL '30 days'
)
SELECT 
  m."originId",
  t."chain",
  ARRAY_AGG(DISTINCT t."facilitator_id") AS facilitator_ids,
  ARRAY_AGG(DISTINCT m."payTo") AS payto_addresses,
  COUNT(*)::int AS total_transactions,
  COALESCE(SUM(t."amount"), 0)::float AS total_amount,
  COUNT(DISTINCT t."sender")::int AS unique_buyers,
  MAX(t."block_timestamp") AS latest_block_timestamp
FROM recent_transfers t
JOIN payto_origin_map m
  ON t."recipient" = m."payTo"
GROUP BY
  m."originId",
  t."chain"
ORDER BY total_transactions DESC;

CREATE UNIQUE INDEX IF NOT EXISTS origin_stats_aggregated_30d_idx
ON origin_stats_aggregated_30d ("originId", chain);

-- Bucketed view
CREATE MATERIALIZED VIEW IF NOT EXISTS origin_stats_bucketed_30d AS
WITH recent_transfers AS (
  SELECT *
  FROM "TransferEvent"
  WHERE "block_timestamp" >= NOW() - INTERVAL '30 days'
)
SELECT 
  time_bucket('15 hours', t."block_timestamp") AS bucket,
  m."originId",
  t."chain",
  COUNT(*)::int AS total_transactions,
  COALESCE(SUM(t."amount"), 0)::float AS total_amount,
  COUNT(DISTINCT t."sender")::int AS unique_buyers,
  MAX(t."block_timestamp") AS latest_block_timestamp
FROM recent_transfers t
JOIN payto_origin_map m
  ON t."recipient" = m."payTo"
GROUP BY
  bucket,
  m."originId",
  t."chain";

CREATE UNIQUE INDEX IF NOT EXISTS origin_stats_bucketed_30d_idx
ON origin_stats_bucketed_30d (bucket, "originId", chain);
