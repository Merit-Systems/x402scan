CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE MATERIALIZED VIEW stats_aggregated_1d AS
SELECT 
  t.facilitator_id AS facilitator_id,
  t.chain AS chain,
  COUNT(*)::int AS total_transactions,
  COALESCE(SUM(t.amount), 0)::float AS total_amount,
  COUNT(DISTINCT t.sender)::int AS unique_buyers,
  COUNT(DISTINCT t.recipient)::int AS unique_sellers,
  MAX(t.block_timestamp) AS latest_block_timestamp
FROM "TransferEvent" AS t
WHERE t.block_timestamp >= NOW() - INTERVAL '1 day'
GROUP BY t.facilitator_id, t.chain;

CREATE UNIQUE INDEX stats_aggregated_1d_idx
ON stats_aggregated_1d (facilitator_id, chain);

CREATE MATERIALIZED VIEW stats_buckets_1d AS
SELECT
  time_bucket('30 minutes', t.block_timestamp) AS bucket,
  t.facilitator_id AS facilitator_id,
  t.chain AS chain,
  COUNT(*)::int AS total_transactions,
  COALESCE(SUM(t.amount), 0)::float AS total_amount,
  COUNT(DISTINCT t.sender)::int AS unique_buyers,
  COUNT(DISTINCT t.recipient)::int AS unique_sellers,
  MAX(t.block_timestamp) AS latest_block_timestamp
FROM "TransferEvent" AS t
WHERE t.block_timestamp >= NOW() - INTERVAL '1 day'
GROUP BY bucket, t.facilitator_id, t.chain;

CREATE UNIQUE INDEX stats_buckets_1d_idx
ON stats_buckets_1d (bucket, facilitator_id, chain);