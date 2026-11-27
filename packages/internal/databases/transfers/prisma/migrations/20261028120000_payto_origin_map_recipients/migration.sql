-- Attribute transfers to an origin by the addresses that proved they receive
-- its payments (scan DB "OriginRecipient"), not only by its accepts' payTo.

-- The scan schema was imported once, before OriginRecipient existed.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'foreign_source' AND table_name = 'OriginRecipient'
  ) THEN
    IMPORT FOREIGN SCHEMA public LIMIT TO ("OriginRecipient")
      FROM SERVER x402scan_server
      INTO foreign_source;
  END IF;
END $$;

-- The origin_stats_* views read payto_origin_map, so they are dropped with it
-- and recreated below unchanged.
DROP MATERIALIZED VIEW IF EXISTS payto_origin_map CASCADE;

CREATE MATERIALIZED VIEW payto_origin_map AS
SELECT
  a."payTo",
  r."originId"
FROM foreign_source."Accepts" a
JOIN foreign_source."Resources" r
  ON a."resourceId" = r."id"
UNION
SELECT
  o."address" AS "payTo",
  o."originId"
FROM foreign_source."OriginRecipient" o;

CREATE UNIQUE INDEX idx_payto_origin_map_payto_origin
  ON payto_origin_map("payTo", "originId");

-- Recreated from 20260106210002_origin_stats_0d
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

-- Recreated from 20260105150212_origin_stats_1d
-- Origin stats materialized views for 1 day timeframe

-- Aggregated view
CREATE MATERIALIZED VIEW IF NOT EXISTS origin_stats_aggregated_1d AS
WITH recent_transfers AS (
  SELECT *
  FROM "TransferEvent"
  WHERE "block_timestamp" >= NOW() - INTERVAL '1 day'
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

CREATE UNIQUE INDEX IF NOT EXISTS origin_stats_aggregated_1d_idx
ON origin_stats_aggregated_1d ("originId", chain);

-- Bucketed view
CREATE MATERIALIZED VIEW IF NOT EXISTS origin_stats_bucketed_1d AS
WITH recent_transfers AS (
  SELECT *
  FROM "TransferEvent"
  WHERE "block_timestamp" >= NOW() - INTERVAL '1 day'
)
SELECT 
  time_bucket('30 minutes', t."block_timestamp") AS bucket,
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

CREATE UNIQUE INDEX IF NOT EXISTS origin_stats_bucketed_1d_idx
ON origin_stats_bucketed_1d (bucket, "originId", chain);

-- Recreated from 20260105150213_origin_stats_7d
-- Origin stats materialized views for 7 days timeframe

-- Aggregated view
CREATE MATERIALIZED VIEW IF NOT EXISTS origin_stats_aggregated_7d AS
WITH recent_transfers AS (
  SELECT *
  FROM "TransferEvent"
  WHERE "block_timestamp" >= NOW() - INTERVAL '7 days'
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

CREATE UNIQUE INDEX IF NOT EXISTS origin_stats_aggregated_7d_idx
ON origin_stats_aggregated_7d ("originId", chain);

-- Bucketed view
CREATE MATERIALIZED VIEW IF NOT EXISTS origin_stats_bucketed_7d AS
WITH recent_transfers AS (
  SELECT *
  FROM "TransferEvent"
  WHERE "block_timestamp" >= NOW() - INTERVAL '7 days'
)
SELECT 
  time_bucket('3 hours 30 minutes', t."block_timestamp") AS bucket,
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

CREATE UNIQUE INDEX IF NOT EXISTS origin_stats_bucketed_7d_idx
ON origin_stats_bucketed_7d (bucket, "originId", chain);

-- Recreated from 20260105150214_origin_stats_14d
-- Origin stats materialized views for 14 days timeframe

-- Aggregated view
CREATE MATERIALIZED VIEW IF NOT EXISTS origin_stats_aggregated_14d AS
WITH recent_transfers AS (
  SELECT *
  FROM "TransferEvent"
  WHERE "block_timestamp" >= NOW() - INTERVAL '14 days'
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

CREATE UNIQUE INDEX IF NOT EXISTS origin_stats_aggregated_14d_idx
ON origin_stats_aggregated_14d ("originId", chain);

-- Bucketed view
CREATE MATERIALIZED VIEW IF NOT EXISTS origin_stats_bucketed_14d AS
WITH recent_transfers AS (
  SELECT *
  FROM "TransferEvent"
  WHERE "block_timestamp" >= NOW() - INTERVAL '14 days'
)
SELECT 
  time_bucket('7 hours', t."block_timestamp") AS bucket,
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

CREATE UNIQUE INDEX IF NOT EXISTS origin_stats_bucketed_14d_idx
ON origin_stats_bucketed_14d (bucket, "originId", chain);

-- Recreated from 20260105150215_origin_stats_30d
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
