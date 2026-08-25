import bs58 from 'bs58';
import { Connection, PublicKey } from '@solana/web3.js';
import type {
  ParsedInnerInstruction,
  ParsedInstruction,
  ParsedMessageAccount,
  PartiallyDecodedInstruction,
  TokenBalance,
} from '@solana/web3.js';
import { logger } from '@trigger.dev/sdk';

import { PAYMENT_CHANNELS_PROGRAM_ID } from '@/trigger/lib/constants';
import type {
  Facilitator,
  FacilitatorConfig,
  SolanaBitquerySentResponse,
  SyncConfig,
  TransferEventData,
} from '@/trigger/types';

// Reuse the exact-scheme Bitquery transfers query: channel payouts are USDC
// transfers CPI'd by the payment-channels program inside facilitator-signed
// transactions, so the same discovery query surfaces them.
export { buildQuery } from '../bitquery/query';

// Payment-channels single-byte instruction discriminators.
const SETTLE_AND_SEAL_DISCRIMINATOR = 4;
const DISTRIBUTE_DISCRIMINATOR = 7;

// Fixed account order of the `distribute` instruction (from the program IDL):
// 0 channel, 1 payer, 2 rent_payer, 3 channel_token_account,
// 4 payer_token_account, 5 payee_token_account, 6 treasury_token_account,
// 7 mint, 8 token_program, 9 event_authority, 10 self_program, 11.. recipients.
const DISTRIBUTE_PAYER_INDEX = 1;
const DISTRIBUTE_ESCROW_INDEX = 3;
const DISTRIBUTE_FIXED_ACCOUNTS = 11;

const ACCOUNTS_CHUNK = 100;
const PARSED_TX_CHUNK = 25;

/**
 * Detects payment-channels `distribute` payouts among facilitator-signed USDC
 * transfers and emits one scheme-tagged TransferEventData per payout leg,
 * attributed to the channel payer. Deposit and refund legs are skipped.
 *
 * Scheme heuristic: a transaction containing `settle_and_seal` is the SVM
 * `upto` settlement shape; standalone `settle`/`distribute` transactions
 * belong to `batch-settlement`. (A batch-settlement cooperative close also
 * uses `settle_and_seal` and is tagged `upto`; that path is rare.)
 */
export async function transformResponse(
  data: SolanaBitquerySentResponse,
  config: SyncConfig,
  facilitator: Facilitator,
  facilitatorConfig: FacilitatorConfig
): Promise<TransferEventData[]> {
  const transfers = data.solana.sent;
  if (transfers.length === 0) return [];

  const rpcUrl = process.env.SOLANA_RPC_URL;
  if (!rpcUrl) {
    throw new Error('SOLANA_RPC_URL is required for solana channel sync');
  }
  const connection = new Connection(rpcUrl, 'confirmed');
  const channelsProgram = new PublicKey(PAYMENT_CHANNELS_PROGRAM_ID);

  // Bitquery timestamps per transaction signature.
  const timestampBySignature = new Map<string, Date>();
  const sendersBySignature = new Map<string, Set<string>>();
  for (const transfer of transfers) {
    const signature = transfer.transaction.signature;
    if (!timestampBySignature.has(signature)) {
      timestampBySignature.set(
        signature,
        new Date(transfer.block.timestamp.time)
      );
      sendersBySignature.set(signature, new Set());
    }
    sendersBySignature.get(signature)!.add(transfer.sender.address);
  }

  // Cheap prefilter: a channel payout's token authority is the channel PDA,
  // which is owned by the payment-channels program. Senders whose account is
  // missing (possibly a reclaimed channel PDA) stay candidates.
  const channelSenders = await findChannelSenders(connection, channelsProgram, [
    ...new Set(transfers.map(t => t.sender.address)),
  ]);

  const candidateSignatures = [...sendersBySignature.entries()]
    .filter(([, senders]) => [...senders].some(s => channelSenders.has(s)))
    .map(([signature]) => signature);

  if (candidateSignatures.length === 0) return [];
  logger.log(
    `[${config.chain}] channels: ${candidateSignatures.length}/${timestampBySignature.size} candidate transactions`
  );

  const events: TransferEventData[] = [];
  for (let i = 0; i < candidateSignatures.length; i += PARSED_TX_CHUNK) {
    const chunk = candidateSignatures.slice(i, i + PARSED_TX_CHUNK);
    const parsed = await connection.getParsedTransactions(chunk, {
      maxSupportedTransactionVersion: 0,
    });
    parsed.forEach((tx, index) => {
      if (!tx || tx.meta?.err) return;
      const signature = chunk[index]!;
      const blockTimestamp =
        timestampBySignature.get(signature) ??
        new Date((tx.blockTime ?? 0) * 1000);
      events.push(
        ...extractPayouts(tx, channelsProgram, {
          signature,
          blockTimestamp,
          config,
          facilitator,
          facilitatorConfig,
        })
      );
    });
  }

  logger.log(
    `[${config.chain}] channels: extracted ${events.length} payout legs`
  );
  return events;
}

async function findChannelSenders(
  connection: Connection,
  channelsProgram: PublicKey,
  senders: string[]
): Promise<Set<string>> {
  const channelSenders = new Set<string>();
  const keys: { address: string; pubkey: PublicKey }[] = [];
  for (const address of senders) {
    try {
      keys.push({ address, pubkey: new PublicKey(address) });
    } catch {
      // not a valid pubkey; skip
    }
  }
  for (let i = 0; i < keys.length; i += ACCOUNTS_CHUNK) {
    const chunk = keys.slice(i, i + ACCOUNTS_CHUNK);
    const infos = await connection.getMultipleAccountsInfo(
      chunk.map(k => k.pubkey)
    );
    infos.forEach((info, index) => {
      // Missing accounts stay candidates: a fully distributed channel PDA can
      // already be reclaimed by the time we look it up.
      if (info === null || info.owner.equals(channelsProgram)) {
        channelSenders.add(chunk[index]!.address);
      }
    });
  }
  return channelSenders;
}

/**
 * The subset of a parsed transaction the payout extractor reads. Structural so
 * `getParsedTransaction(s)` results flow in unchanged and fixtures can be
 * built without asserting through the full web3.js transaction type.
 */
export interface PayoutTransaction {
  transaction: {
    message: {
      accountKeys: Pick<ParsedMessageAccount, 'pubkey'>[];
      instructions: (ParsedInstruction | PartiallyDecodedInstruction)[];
    };
  };
  meta: {
    innerInstructions?: ParsedInnerInstruction[] | null;
    postTokenBalances?: Pick<TokenBalance, 'accountIndex' | 'owner'>[] | null;
  } | null;
}

export function extractPayouts(
  tx: PayoutTransaction,
  channelsProgram: PublicKey,
  context: {
    signature: string;
    blockTimestamp: Date;
    config: SyncConfig;
    facilitator: Facilitator;
    facilitatorConfig: FacilitatorConfig;
  }
): TransferEventData[] {
  const instructions = tx.transaction.message.instructions;
  const channelInstructions = instructions
    .map((instruction, index) => ({ instruction, index }))
    .filter(
      (
        entry
      ): entry is { instruction: PartiallyDecodedInstruction; index: number } =>
        'data' in entry.instruction &&
        entry.instruction.programId.equals(channelsProgram)
    );
  if (channelInstructions.length === 0) return [];

  const discriminators = channelInstructions.map(
    ({ instruction }) => bs58.decode(instruction.data)[0]
  );
  const scheme = discriminators.includes(SETTLE_AND_SEAL_DISCRIMINATOR)
    ? 'upto'
    : 'batch-settlement';

  // Map token accounts to their owner wallets using the balance metadata.
  const accountKeys = tx.transaction.message.accountKeys;
  const ownerByTokenAccount = new Map<string, string>();
  for (const balance of tx.meta?.postTokenBalances ?? []) {
    const key = accountKeys[balance.accountIndex]?.pubkey.toBase58();
    if (key && balance.owner) ownerByTokenAccount.set(key, balance.owner);
  }

  const events: TransferEventData[] = [];
  let logIndex = 0;
  for (const { instruction, index } of channelInstructions) {
    if (bs58.decode(instruction.data)[0] !== DISTRIBUTE_DISCRIMINATOR) continue;
    if (instruction.accounts.length <= DISTRIBUTE_FIXED_ACCOUNTS) continue;

    const payer = instruction.accounts[DISTRIBUTE_PAYER_INDEX]!.toBase58();
    const escrow = instruction.accounts[DISTRIBUTE_ESCROW_INDEX]!.toBase58();
    // Merchant payouts are exactly the legs to the dynamic recipient tail
    // (accounts 11..). Payer refunds, the payee implicit remainder, and the
    // treasury residual are not payments to the merchant. Matching the tail
    // (rather than excluding accounts 4-6) also handles clients that pass a
    // recipient's ATA as the treasury account: observed live from pay.sh,
    // where treasury_token_account equals the recipient ATA.
    const payoutDestinations = new Set(
      instruction.accounts
        .slice(DISTRIBUTE_FIXED_ACCOUNTS)
        .map(account => account.toBase58())
    );

    const inner =
      tx.meta?.innerInstructions?.find(entry => entry.index === index)
        ?.instructions ?? [];
    for (const leg of inner.flatMap(parseTokenTransfers)) {
      if (leg.source !== escrow) continue;
      if (!payoutDestinations.has(leg.destination)) continue;

      events.push({
        address: context.facilitatorConfig.token.address,
        transaction_from: context.facilitatorConfig.address,
        sender: payer,
        recipient: ownerByTokenAccount.get(leg.destination) ?? leg.destination,
        amount: Number(leg.amount),
        block_timestamp: context.blockTimestamp,
        tx_hash: context.signature,
        chain: context.config.chain,
        provider: context.config.provider,
        decimals: context.facilitatorConfig.token.decimals,
        facilitator_id: context.facilitator.id,
        log_index: logIndex++,
        scheme,
      });
    }
  }
  return events;
}

interface ParsedTokenInstruction {
  type?: string;
  info?: {
    source?: string;
    destination?: string;
    amount?: string;
    tokenAmount?: { amount?: string };
    instructions?: ParsedTokenInstruction[];
  };
}

function parseTokenTransfers(
  instruction: ParsedInstruction | PartiallyDecodedInstruction
): { source: string; destination: string; amount: string }[] {
  if (!('parsed' in instruction)) return [];
  return flattenTokenTransfers(instruction.parsed as ParsedTokenInstruction);
}

// The sealed distribute path emits SPL Token `batch` instructions that nest
// the individual transfers; unwrap them alongside plain transfers.
function flattenTokenTransfers(
  parsed: ParsedTokenInstruction
): { source: string; destination: string; amount: string }[] {
  if (parsed.type === 'batch') {
    return (parsed.info?.instructions ?? []).flatMap(flattenTokenTransfers);
  }
  if (parsed.type !== 'transfer' && parsed.type !== 'transferChecked') {
    return [];
  }
  const info = parsed.info;
  const amount = info?.tokenAmount?.amount ?? info?.amount;
  if (!info?.source || !info.destination || !amount) return [];
  return [{ source: info.source, destination: info.destination, amount }];
}
