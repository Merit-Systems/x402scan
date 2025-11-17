CREATE MATERIALIZED VIEW stats_aggregated_14d AS
SELECT 
  t.facilitator_id AS facilitator_id,
  t.chain AS chain,
  COUNT(*)::int AS total_transactions,
  COALESCE(SUM(t.amount), 0)::float AS total_amount,
  COUNT(DISTINCT t.sender)::int AS unique_buyers,
  COUNT(DISTINCT t.recipient)::int AS unique_sellers,
  MAX(t.block_timestamp) AS latest_block_timestamp
FROM "TransferEvent" AS t
WHERE t.block_timestamp >= NOW() - INTERVAL '14 days'
GROUP BY t.facilitator_id, t.chain;

CREATE UNIQUE INDEX stats_aggregated_14d_idx
ON stats_aggregated_14d (facilitator_id, chain);

CREATE MATERIALIZED VIEW stats_buckets_14d AS
SELECT
  time_bucket('7 hours', t.block_timestamp) AS bucket,
  t.facilitator_id,
  t.chain,
  COUNT(*)::int               AS total_transactions,
  COALESCE(SUM(t.amount),0)::float AS total_amount,
  COUNT(DISTINCT t.sender)::int    AS unique_buyers,
  COUNT(DISTINCT t.recipient)::int AS unique_sellers,
  MAX(t.block_timestamp)      AS latest_block_timestamp
FROM "TransferEvent" t
WHERE t.block_timestamp >= NOW() - INTERVAL '14 days'
GROUP BY bucket, t.facilitator_id, t.chain;

CREATE UNIQUE INDEX stats_buckets_14d_idx
ON stats_buckets_14d (bucket, facilitator_id, chain);