CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- Create connection to the scan database
CREATE SERVER x402scan_server FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (host 'ep-long-hat-adeyu446-pooler.c-2.us-east-1.aws.neon.tech', dbname 'neondb', port '5432');
CREATE USER MAPPING FOR current_user SERVER x402scan_server
  OPTIONS (user 'neondb_owner', password 'xxxx');
-- Create the schema for the foreign db
CREATE SCHEMA foreign_source;
-- Manually define enums
CREATE TYPE public."AcceptsScheme" AS ENUM ('exact');
CREATE TYPE public."ResourceType" AS ENUM ('http');
CREATE TYPE public."AcceptsNetwork" AS ENUM (
  'base_sepolia',
  'avalanche_fuji',
  'base',
  'sei',
  'sei_testnet',
  'avalanche',
  'iotex',
  'solana_devnet',
  'solana',
  'polygon',
  'optimism'
);
CREATE TYPE public."Visibility" AS ENUM (
  'public',
  'private'
);
CREATE TYPE public."SessionStatus" AS ENUM (
  'ONRAMP_TRANSACTION_STATUS_IN_PROGRESS',
  'ONRAMP_TRANSACTION_STATUS_SUCCESS',
  'ONRAMP_TRANSACTION_STATUS_FAILED'
);
CREATE TYPE public."ServerWalletType" AS ENUM (
  'AGENT',
  'CHAT'
);
CREATE TYPE public."Role" AS ENUM (
  'user',
  'admin'
);

-- Import the schema into this DB
IMPORT FOREIGN SCHEMA public
  FROM SERVER x402scan_server
  INTO foreign_source;



-- Create materilized view for the payTo -> origin mapping to reference
CREATE MATERIALIZED VIEW IF NOT EXISTS payto_origin_map AS
SELECT DISTINCT
  a."payTo",
  r."originId"
FROM foreign_source."Accepts" a
JOIN foreign_source."Resources" r
  ON a."resourceId" = r."id";
CREATE UNIQUE INDEX IF NOT EXISTS idx_payto_origin_map_payto_origin
  ON payto_origin_map("payTo", "originId");

-- Create materialized view for payTo stats (both aggregated and bucketed)
-- 1d
-- aggregates
CREATE MATERIALIZED VIEW recipient_stats_aggregated_1d AS
WITH recent_transfers AS (
  SELECT *
  FROM "TransferEvent"
  WHERE "block_timestamp" >= NOW() - INTERVAL '1 day'
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

CREATE UNIQUE INDEX recipient_stats_aggregated_1d_idx
ON recipient_stats_aggregated_1d (recipient, chain);

-- bucketed
CREATE MATERIALIZED VIEW recipient_stats_bucketed_1d AS
WITH recent_transfers AS (
  SELECT *
  FROM "TransferEvent"
  WHERE "block_timestamp" >= NOW() - INTERVAL '1 day'
)
SELECT 
  time_bucket('30 minutes', t."block_timestamp") AS bucket,
  t."recipient",
  t."chain",
  COUNT(*)::int AS total_transactions,
  COALESCE(SUM(t."amount"), 0)::float AS total_amount,
  COUNT(DISTINCT t."sender")::int AS unique_buyers,
  MAX(t."block_timestamp") AS latest_block_timestamp
FROM recent_transfers t
GROUP BY
  bucket,
  t."recipient",
  t."chain";

CREATE UNIQUE INDEX recipient_stats_bucketed_1d_idx
ON recipient_stats_bucketed_1d (bucket, recipient, chain);
-- 7d
-- aggregates
CREATE MATERIALIZED VIEW recipient_stats_aggregated_7d AS
WITH recent_transfers AS (
  SELECT *
  FROM "TransferEvent"
  WHERE "block_timestamp" >= NOW() - INTERVAL '7 days'
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

CREATE UNIQUE INDEX recipient_stats_aggregated_7d_idx
ON recipient_stats_aggregated_7d (recipient, chain);
-- bucketed
CREATE MATERIALIZED VIEW recipient_stats_bucketed_7d AS
WITH recent_transfers AS (
  SELECT *
  FROM "TransferEvent"
  WHERE "block_timestamp" >= NOW() - INTERVAL '7 days'
)
SELECT 
  time_bucket('3 hours 30 minutes', t."block_timestamp") AS bucket,
  t."recipient",
  t."chain",
  COUNT(*)::int AS total_transactions,
  COALESCE(SUM(t."amount"), 0)::float AS total_amount,
  COUNT(DISTINCT t."sender")::int AS unique_buyers,
  MAX(t."block_timestamp") AS latest_block_timestamp
FROM recent_transfers t
GROUP BY
  bucket,
  t."recipient",
  t."chain";

CREATE UNIQUE INDEX recipient_stats_bucketed_7d_idx
ON recipient_stats_bucketed_7d (bucket, recipient, chain);

-- 14d
-- aggregates
CREATE MATERIALIZED VIEW recipient_stats_aggregated_14d AS
WITH recent_transfers AS (
  SELECT *
  FROM "TransferEvent"
  WHERE "block_timestamp" >= NOW() - INTERVAL '14 days'
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

CREATE UNIQUE INDEX recipient_stats_aggregated_14d_idx
ON recipient_stats_aggregated_14d (recipient, chain);

-- bucketed
CREATE MATERIALIZED VIEW recipient_stats_bucketed_14d AS
WITH recent_transfers AS (
  SELECT *
  FROM "TransferEvent"
  WHERE "block_timestamp" >= NOW() - INTERVAL '14 days'
)
SELECT 
  time_bucket('7 hours', t."block_timestamp") AS bucket,
  t."recipient",
  t."chain",
  COUNT(*)::int AS total_transactions,
  COALESCE(SUM(t."amount"), 0)::float AS total_amount,
  COUNT(DISTINCT t."sender")::int AS unique_buyers,
  MAX(t."block_timestamp") AS latest_block_timestamp
FROM recent_transfers t
GROUP BY
  bucket,
  t."recipient",
  t."chain";

CREATE UNIQUE INDEX recipient_stats_bucketed_14d_idx
ON recipient_stats_bucketed_14d (bucket, recipient, chain);

-- 30d
-- aggregates
CREATE MATERIALIZED VIEW recipient_stats_aggregated_30d AS
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

CREATE UNIQUE INDEX recipient_stats_aggregated_30d_idx
ON recipient_stats_aggregated_30d (recipient, chain);

-- bucketed
CREATE MATERIALIZED VIEW recipient_stats_bucketed_30d AS
WITH recent_transfers AS (
  SELECT *
  FROM "TransferEvent"
  WHERE "block_timestamp" >= NOW() - INTERVAL '30 days'
)
SELECT 
  time_bucket('15 hours', t."block_timestamp") AS bucket,
  t."recipient",
  t."chain",
  COUNT(*)::int AS total_transactions,
  COALESCE(SUM(t."amount"), 0)::float AS total_amount,
  COUNT(DISTINCT t."sender")::int AS unique_buyers,
  MAX(t."block_timestamp") AS latest_block_timestamp
FROM recent_transfers t
GROUP BY
  bucket,
  t."recipient",
  t."chain";

CREATE UNIQUE INDEX recipient_stats_bucketed_30d_idx
ON recipient_stats_bucketed_30d (bucket, recipient, chain);

-- Create materilized view for the origin stats (both aggregated and bucketed)
-- 1d
-- aggregates
CREATE MATERIALIZED VIEW origin_stats_aggregated_1d AS
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

CREATE UNIQUE INDEX origin_stats_aggregated_1d_idx
ON origin_stats_aggregated_1d (originId, chain);

-- bucketed
CREATE MATERIALIZED VIEW origin_stats_bucketed_1d AS
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

CREATE UNIQUE INDEX origin_stats_bucketed_1d_idx
ON origin_stats_bucketed_1d (bucket, originId, chain);
-- 7d
-- aggregates
CREATE MATERIALIZED VIEW origin_stats_aggregated_7d AS
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

CREATE UNIQUE INDEX origin_stats_aggregated_7d_idx
ON origin_stats_aggregated_7d ("originId", chain);

-- bucketed
CREATE MATERIALIZED VIEW origin_stats_bucketed_7d AS
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

CREATE UNIQUE INDEX origin_stats_bucketed_7d_idx
ON origin_stats_bucketed_7d (bucket, "originId", chain);

-- 14d
-- aggregates
CREATE MATERIALIZED VIEW origin_stats_aggregated_14d AS
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

CREATE UNIQUE INDEX origin_stats_aggregated_14d_idx
ON origin_stats_aggregated_14d ("originId", chain);

-- bucketed
CREATE MATERIALIZED VIEW origin_stats_bucketed_14d AS
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

CREATE UNIQUE INDEX origin_stats_bucketed_14d_idx
ON origin_stats_bucketed_14d (bucket, "originId", chain);

-- 30d
-- aggregates
CREATE MATERIALIZED VIEW origin_stats_aggregated_30d AS
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

CREATE UNIQUE INDEX origin_stats_aggregated_30d_idx
ON origin_stats_aggregated_30d ("originId", chain);

-- bucketed
CREATE MATERIALIZED VIEW origin_stats_bucketed_30d AS
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

CREATE UNIQUE INDEX origin_stats_bucketed_30d_idx
ON origin_stats_bucketed_30d (bucket, "originId", chain);