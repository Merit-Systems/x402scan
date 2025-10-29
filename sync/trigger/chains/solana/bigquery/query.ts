import {
  SyncConfig,
  Facilitator,
  TransferEventData,
  BigQueryTransferRow,
  FacilitatorConfig,
} from '@/trigger/types';
import { USDC_MULTIPLIER, USDC_SOLANA } from '@facilitators/constants';
import { getAccount } from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';
import Bottleneck from 'bottleneck';

export function buildQuery(
  config: SyncConfig,
  facilitatorConfig: FacilitatorConfig,
  since: Date,
  now: Date
): string {
  return `
        DECLARE signer_pubkeys ARRAY<STRING> DEFAULT [
        "${facilitatorConfig.address}"
        ];
        DECLARE usdc_mint STRING DEFAULT '${USDC_SOLANA}';
        DECLARE start_ts TIMESTAMP DEFAULT TIMESTAMP('${since.toISOString()}');
        DECLARE end_ts TIMESTAMP DEFAULT TIMESTAMP('${now.toISOString()}');

        WITH signer_sigs AS (
        SELECT DISTINCT
            tx.signature,
            (
            SELECT a.pubkey
            FROM UNNEST(tx.accounts) AS a WITH OFFSET AS idx
            WHERE a.signer = TRUE
            ORDER BY idx
            LIMIT 1
            ) AS fee_payer,
            (
            SELECT a.pubkey
            FROM UNNEST(tx.accounts) AS a
            WHERE a.signer = TRUE AND a.pubkey IN UNNEST(signer_pubkeys)
            LIMIT 1
            ) AS matched_signer
        FROM \`robust-catalyst-475116-s4.crypto_solana_mainnet_us.Transactions\` tx
        WHERE tx.block_timestamp >= start_ts AND tx.block_timestamp < end_ts
            AND EXISTS (
            SELECT 1 FROM UNNEST(tx.accounts) a
            WHERE a.signer = TRUE AND a.pubkey IN UNNEST(signer_pubkeys)
            )
        )
        SELECT 
        t.mint AS address, 
        s.fee_payer AS transaction_from,
        t.source AS sender, 
        t.destination AS recipient,
        SAFE_DIVIDE(t.value, POW(10, t.decimals)) AS amount,
        t.block_timestamp, 
        t.tx_signature AS tx_hash,
        COALESCE(
            CASE 
                WHEN i.parent_index IS NOT NULL THEN i.parent_index * 1000 + i.index
                ELSE i.index
            END,
            ROW_NUMBER() OVER (PARTITION BY t.tx_signature ORDER BY t.block_timestamp, t.source, t.destination, t.value) - 1
        ) AS transfer_index,
        '${config.chain}' AS chain
        FROM \`robust-catalyst-475116-s4.crypto_solana_mainnet_us.Token Transfers\` t
        JOIN signer_sigs s ON t.tx_signature = s.signature
        LEFT JOIN \`robust-catalyst-475116-s4.crypto_solana_mainnet_us.Instructions\` i
            ON t.tx_signature = i.tx_signature
            AND t.block_timestamp = i.block_timestamp
            AND i.program = 'spl-token'
            AND i.instruction_type IN ('transfer', 'transferChecked')
        WHERE t.block_timestamp >= start_ts AND t.block_timestamp < end_ts
        AND t.mint = usdc_mint 
        AND t.value IS NOT NULL 
        AND t.decimals IS NOT NULL
        ORDER BY t.block_timestamp DESC
        LIMIT ${config.limit}`;
}

/**
 * NOTE(shafu + json): This is a very temporary solution! very bad and does not scale!
 * Has to be replaces asap but we wanted to shipy shipy.
 * Great Tech.
 */
export async function transformResponse(
  data: unknown,
  config: SyncConfig,
  facilitator: Facilitator,
  facilitatorConfig: FacilitatorConfig
): Promise<TransferEventData[]> {
  const connection = new Connection(process.env.SOLANA_RPC_URL!);

  const ownerCache = new Map<string, string>();

  const limiter = new Bottleneck({
    reservoir: 150,
    reservoirRefreshAmount: 150,
    reservoirRefreshInterval: 1000,
    minTime: 7,
    maxConcurrent: 10,
  });

  const results = await Promise.all(
    (data as BigQueryTransferRow[]).map(row =>
      limiter.schedule(async () => {
        const senderOwner = await getOwner(row.sender, connection, ownerCache);
        const recipientOwner = await getOwner(
          row.recipient,
          connection,
          ownerCache
        );

        return {
          address: row.address,
          transaction_from: row.transaction_from,
          sender: senderOwner,
          recipient: recipientOwner,
          amount: Math.round(parseFloat(row.amount) * USDC_MULTIPLIER),
          block_timestamp: new Date(row.block_timestamp.value),
          tx_hash: row.tx_hash,
          chain: row.chain,
          provider: config.provider,
          decimals: facilitatorConfig.token.decimals,
          facilitator_id: facilitator.id,
          log_index: row.transfer_index,
        };
      })
    )
  );

  return results;
}

async function getOwner(
  address: string,
  connection: Connection,
  cache: Map<string, string>
): Promise<string> {
  const addressTokenAccount = new PublicKey(address);
  const key = addressTokenAccount.toBase58();
  if (cache.has(key)) {
    return cache.get(key)!;
  }
  const accountInfo = await getAccount(connection, addressTokenAccount);
  const owner = accountInfo.owner.toBase58();
  cache.set(key, owner);
  return owner;
}
