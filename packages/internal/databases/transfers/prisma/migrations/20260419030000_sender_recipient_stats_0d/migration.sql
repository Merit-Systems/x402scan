-- Sender×Recipient all-time stats materialized view
-- Preserves the sender→recipient edge for trusted-buyer attribution in the usage signal pipeline.

CREATE MATERIALIZED VIEW IF NOT EXISTS sender_recipient_stats_aggregated_0d AS
SELECT
  t."sender",
  t."recipient",
  t."chain",
  COUNT(*)::int AS total_transactions,
  COALESCE(SUM(t."amount"), 0)::float AS total_amount,
  MAX(t."block_timestamp") AS latest_block_timestamp
FROM "TransferEvent" t
GROUP BY
  t."sender",
  t."recipient",
  t."chain";

CREATE UNIQUE INDEX IF NOT EXISTS sender_recipient_stats_agg_0d_idx
  ON sender_recipient_stats_aggregated_0d (sender, recipient, chain);
