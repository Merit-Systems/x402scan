-- Run with:
--   set -a; source .vercel/.env.production.local; set +a
--   psql "$SCAN_DATABASE_URL" -f evals/runner/prod-solana-sampling.sql

-- 1) Solana network distribution in stored x402 responses.
with rows as (
  select jsonb_array_elements(coalesce(rr.response->'accepts', '[]'::jsonb)) as accept
  from "ResourceResponse" rr
)
select
  coalesce(accept->>'network', '<missing>') as network,
  count(*) as count
from rows
where coalesce(accept->>'network', '') ilike '%solana%'
group by 1
order by count desc;

-- 2) Recent resources using compatibility aliases or suspect Solana refs.
with rows as (
  select
    r.resource,
    r."lastUpdated",
    rr.response,
    rr.response->>'x402Version' as version,
    jsonb_array_elements(coalesce(rr.response->'accepts', '[]'::jsonb)) as accept
  from "ResourceResponse" rr
  join "Resources" r
    on r.id = rr."resourceId"
)
select
  resource,
  "lastUpdated",
  version,
  accept->>'network' as network
from rows
where accept->>'network' in (
  'solana:mainnet',
  'solana:devnet',
  'solana:testnet',
  'solana-devnet',
  'solana-mainnet-beta'
)
order by "lastUpdated" desc
limit 50;

-- 3) Solana resources missing input/output schema paths.
with rows as (
  select
    r.resource,
    r."lastUpdated",
    rr.response,
    rr.response->>'x402Version' as version,
    jsonb_array_elements(coalesce(rr.response->'accepts', '[]'::jsonb)) as accept
  from "ResourceResponse" rr
  join "Resources" r
    on r.id = rr."resourceId"
),
sol as (
  select *
  from rows
  where coalesce(accept->>'network', '') ilike '%solana%'
)
select
  resource,
  version,
  accept->>'network' as network,
  case
    when version = '1' then (accept->'outputSchema'->'input' is null)
    when version = '2' then (response->'extensions'->'bazaar'->'info'->'input' is null)
    else null
  end as missing_input,
  case
    when version = '1' then (accept->'outputSchema'->'output' is null)
    when version = '2' then (response->'extensions'->'bazaar'->'info'->'output' is null)
    else null
  end as missing_output,
  "lastUpdated"
from sol
where
  case
    when version = '1' then (accept->'outputSchema'->'input' is null)
    when version = '2' then (response->'extensions'->'bazaar'->'info'->'input' is null)
    else false
  end
  or
  case
    when version = '1' then (accept->'outputSchema'->'output' is null)
    when version = '2' then (response->'extensions'->'bazaar'->'info'->'output' is null)
    else false
  end
order by "lastUpdated" desc
limit 100;
