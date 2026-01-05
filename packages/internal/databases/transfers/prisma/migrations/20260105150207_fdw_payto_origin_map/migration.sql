-- Foreign Data Wrapper setup for scan database access
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- Create connection to the scan database
CREATE SERVER IF NOT EXISTS x402scan_server FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (host 'ep-noisy-brook-adjd5gsj.c-2.us-east-1.aws.neon.tech', dbname 'neondb', port '5432');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_user_mappings
    WHERE srvname = 'x402scan_server' AND usename = current_user
  ) THEN
    CREATE USER MAPPING FOR current_user SERVER x402scan_server
      OPTIONS (user 'neondb_owner', password 'npg_d0c6QoumVCXW');
  END IF;
END $$;

-- Create the schema for the foreign db
CREATE SCHEMA IF NOT EXISTS foreign_source;

-- Manually define enums from scan database
DO $$ BEGIN CREATE TYPE public."AcceptsScheme" AS ENUM ('exact'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public."ResourceType" AS ENUM ('http'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public."AcceptsNetwork" AS ENUM (
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
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public."Visibility" AS ENUM (
  'public',
  'private'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public."SessionStatus" AS ENUM (
  'ONRAMP_TRANSACTION_STATUS_IN_PROGRESS',
  'ONRAMP_TRANSACTION_STATUS_SUCCESS',
  'ONRAMP_TRANSACTION_STATUS_FAILED'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public."ServerWalletType" AS ENUM (
  'AGENT',
  'CHAT'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public."Role" AS ENUM (
  'user',
  'admin'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Import the schema into this DB (only if tables don't exist yet)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'foreign_source' AND table_name = 'Accepts'
  ) THEN
    IMPORT FOREIGN SCHEMA public
      FROM SERVER x402scan_server
      INTO foreign_source;
  END IF;
END $$;

-- Create materialized view for the payTo -> origin mapping to reference
CREATE MATERIALIZED VIEW IF NOT EXISTS payto_origin_map AS
SELECT DISTINCT
  a."payTo",
  r."originId"
FROM foreign_source."Accepts" a
JOIN foreign_source."Resources" r
  ON a."resourceId" = r."id";

CREATE UNIQUE INDEX IF NOT EXISTS idx_payto_origin_map_payto_origin
  ON payto_origin_map("payTo", "originId");
