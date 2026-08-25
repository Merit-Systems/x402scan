/**
 * Manual probe for the payment-channels payout extractor.
 *
 * Fetches a real transaction and prints the TransferEvent rows the
 * bitquery-channels sync would emit for it — no Bitquery or database needed.
 *
 * Usage:
 *   SOLANA_RPC_URL=https://api.devnet.solana.com \
 *     pnpm probe:channels <signature> [facilitator-address]
 */
import { Connection, PublicKey } from '@solana/web3.js';

import { extractPayouts } from '../trigger/chains/solana/bitquery-channels/query';
import {
  PAYMENT_CHANNELS_PROGRAM_ID,
  USDC_SOLANA,
} from '../trigger/lib/constants';
import type {
  Facilitator,
  FacilitatorConfig,
  SyncConfig,
} from '../trigger/types';
import { PaginationStrategy, QueryProvider } from '../trigger/types';

async function main() {
  const [signature, facilitatorAddress] = process.argv.slice(2);
  const rpcUrl = process.env.SOLANA_RPC_URL;
  if (!signature || !rpcUrl) {
    console.error(
      'Usage: SOLANA_RPC_URL=<url> pnpm probe:channels <signature> [facilitator-address]'
    );
    process.exit(1);
  }

  const connection = new Connection(rpcUrl, 'confirmed');
  const tx = await connection.getParsedTransaction(signature, {
    maxSupportedTransactionVersion: 0,
  });
  if (!tx) {
    console.error(`Transaction ${signature} not found on ${rpcUrl}`);
    process.exit(1);
  }
  if (tx.meta?.err) {
    console.error(`Transaction failed onchain:`, tx.meta.err);
    process.exit(1);
  }

  const feePayer = tx.transaction.message.accountKeys[0]?.pubkey.toBase58();
  const mint = tx.meta?.postTokenBalances?.[0]?.mint ?? USDC_SOLANA;

  const facilitatorConfig: FacilitatorConfig = {
    address: facilitatorAddress ?? feePayer ?? '',
    enabled: true,
    syncStartDate: new Date(0),
    token: {
      address: mint,
      decimals: 6,
      name: 'probe',
      symbol: 'PROBE',
    } as FacilitatorConfig['token'],
  };
  const facilitator: Facilitator = { id: 'probe', addresses: {} };
  const config = {
    chain: 'solana',
    provider: QueryProvider.BITQUERY_CHANNELS,
    paginationStrategy: PaginationStrategy.OFFSET,
  } as SyncConfig;

  const events = extractPayouts(
    tx,
    new PublicKey(PAYMENT_CHANNELS_PROGRAM_ID),
    {
      signature,
      blockTimestamp: new Date((tx.blockTime ?? 0) * 1000),
      config,
      facilitator,
      facilitatorConfig,
    }
  );

  if (events.length === 0) {
    console.log(
      'No payout legs extracted. Either this transaction has no payment-channels distribute, or every leg was a payer refund / payee / treasury transfer.'
    );
  } else {
    console.log(`Extracted ${events.length} payout leg(s):`);
    console.log(JSON.stringify(events, null, 2));
  }
}

void main();
