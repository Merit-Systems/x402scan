-- All-time (0d) overall stats materialized views

CREATE MATERIALIZED VIEW stats_aggregated_0d AS
SELECT 
  t.facilitator_id AS facilitator_id,
  t.chain AS chain,
  COUNT(*)::int AS total_transactions,
  COALESCE(SUM(t.amount), 0)::float AS total_amount,
  COUNT(DISTINCT t.sender)::int AS unique_buyers,
  COUNT(DISTINCT t.recipient)::int AS unique_sellers,
  MAX(t.block_timestamp) AS latest_block_timestamp
FROM "TransferEvent" AS t
GROUP BY t.facilitator_id, t.chain;

CREATE UNIQUE INDEX stats_aggregated_0d_idx
ON stats_aggregated_0d (facilitator_id, chain);

-- Bucketed view with 1-day buckets for all-time data
CREATE MATERIALIZED VIEW stats_buckets_0d AS
SELECT
  time_bucket('1 day', t.block_timestamp) AS bucket,
  t.facilitator_id AS facilitator_id,
  t.chain AS chain,
  COUNT(*)::int AS total_transactions,
  COALESCE(SUM(t.amount), 0)::float AS total_amount,
  COUNT(DISTINCT t.sender)::int AS unique_buyers,
  COUNT(DISTINCT t.recipient)::int AS unique_sellers,
  MAX(t.block_timestamp) AS latest_block_timestamp
FROM "TransferEvent" AS t
GROUP BY bucket, t.facilitator_id, t.chain;

CREATE UNIQUE INDEX stats_buckets_0d_idx
ON stats_buckets_0d (bucket, facilitator_id, chain);
