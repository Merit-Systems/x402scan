import bs58 from 'bs58';
import { Keypair, PublicKey } from '@solana/web3.js';
import type { ParsedTransactionWithMeta } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

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

const CHANNELS_PROGRAM = new PublicKey(PAYMENT_CHANNELS_PROGRAM_ID);
const TOKEN_PROGRAM = new PublicKey(
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
);

const OPEN = 1;
const SETTLE = 2;
const SETTLE_AND_SEAL = 4;
const DISTRIBUTE = 7;

function key(): PublicKey {
  return Keypair.generate().publicKey;
}

const facilitatorAddress = key().toBase58();

const facilitatorConfig: FacilitatorConfig = {
  address: facilitatorAddress,
  enabled: true,
  syncStartDate: new Date('2026-01-01T00:00:00Z'),
  token: {
    address: USDC_SOLANA,
    decimals: 6,
    name: 'USD Coin',
    symbol: 'USDC',
  } as FacilitatorConfig['token'],
};

const facilitator: Facilitator = {
  id: 'test-facilitator',
  addresses: {},
};

const config = {
  chain: 'solana',
  provider: QueryProvider.BITQUERY_CHANNELS,
  paginationStrategy: PaginationStrategy.OFFSET,
} as SyncConfig;

const context = {
  signature: 'test-signature',
  blockTimestamp: new Date('2026-08-21T12:00:00Z'),
  config,
  facilitator,
  facilitatorConfig,
};

interface ChannelIxSpec {
  discriminator: number;
  accounts?: PublicKey[];
}

interface TransferLegSpec {
  source: PublicKey;
  destination: PublicKey;
  amount: string;
  atInstructionIndex: number;
}

/** Distribute account layout: 11 fixed accounts + recipient token accounts. */
function distributeAccounts(parts: {
  payer: PublicKey;
  escrow: PublicKey;
  payerAta: PublicKey;
  payeeAta: PublicKey;
  treasuryAta: PublicKey;
  recipients: PublicKey[];
}): PublicKey[] {
  return [
    key(), // channel PDA
    parts.payer,
    key(), // rent payer
    parts.escrow,
    parts.payerAta,
    parts.payeeAta,
    parts.treasuryAta,
    new PublicKey(USDC_SOLANA),
    TOKEN_PROGRAM,
    key(), // event authority
    CHANNELS_PROGRAM, // self program
    ...parts.recipients,
  ];
}

function buildTx(
  channelInstructions: ChannelIxSpec[],
  legs: TransferLegSpec[],
  ownersByAta: Map<PublicKey, PublicKey>
): ParsedTransactionWithMeta {
  const accountKeys = [...ownersByAta.keys()].map(pubkey => ({ pubkey }));
  const postTokenBalances = [...ownersByAta.entries()].map(
    ([ata, owner], accountIndex) => {
      void ata;
      return {
        accountIndex,
        mint: USDC_SOLANA,
        owner: owner.toBase58(),
        uiTokenAmount: { amount: '0', decimals: 6 },
      };
    }
  );

  const instructions = channelInstructions.map(spec => ({
    programId: CHANNELS_PROGRAM,
    accounts: spec.accounts ?? [],
    data: bs58.encode(Buffer.from([spec.discriminator])),
  }));

  const innerByIndex = new Map<number, TransferLegSpec[]>();
  for (const leg of legs) {
    const list = innerByIndex.get(leg.atInstructionIndex) ?? [];
    list.push(leg);
    innerByIndex.set(leg.atInstructionIndex, list);
  }
  const innerInstructions = [...innerByIndex.entries()].map(
    ([index, indexLegs]) => ({
      index,
      instructions: indexLegs.map(leg => ({
        program: 'spl-token',
        programId: TOKEN_PROGRAM,
        parsed: {
          type: 'transferChecked',
          info: {
            source: leg.source.toBase58(),
            destination: leg.destination.toBase58(),
            mint: USDC_SOLANA,
            tokenAmount: { amount: leg.amount, decimals: 6 },
          },
        },
      })),
    })
  );

  return {
    blockTime: 1_755_000_000,
    transaction: { message: { accountKeys, instructions } },
    meta: { err: null, innerInstructions, postTokenBalances },
  } as unknown as ParsedTransactionWithMeta;
}

describe('extractPayouts', () => {
  const payer = key();
  const escrow = key();
  const payerAta = key();
  const payeeAta = key();
  const treasuryAta = key();
  const recipientAta = key();
  const recipientOwner = key();

  const accounts = distributeAccounts({
    payer,
    escrow,
    payerAta,
    payeeAta,
    treasuryAta,
    recipients: [recipientAta],
  });

  it('emits one payout leg attributed to the channel payer', () => {
    const tx = buildTx(
      [{ discriminator: DISTRIBUTE, accounts }],
      [
        // payout to the merchant recipient
        { source: escrow, destination: recipientAta, amount: '5000', atInstructionIndex: 0 },
        // refund remainder back to the payer — must be skipped
        { source: escrow, destination: payerAta, amount: '95000', atInstructionIndex: 0 },
      ],
      new Map([[recipientAta, recipientOwner]])
    );

    const events = extractPayouts(tx, CHANNELS_PROGRAM, context);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      address: USDC_SOLANA,
      amount: 5000,
      chain: 'solana',
      facilitator_id: 'test-facilitator',
      log_index: 0,
      recipient: recipientOwner.toBase58(),
      scheme: 'batch-settlement',
      sender: payer.toBase58(),
      transaction_from: facilitatorAddress,
      tx_hash: 'test-signature',
    });
  });

  it('tags settle_and_seal transactions as upto', () => {
    const tx = buildTx(
      [
        { discriminator: SETTLE_AND_SEAL, accounts },
        { discriminator: DISTRIBUTE, accounts },
      ],
      [{ source: escrow, destination: recipientAta, amount: '700', atInstructionIndex: 1 }],
      new Map([[recipientAta, recipientOwner]])
    );

    const events = extractPayouts(tx, CHANNELS_PROGRAM, context);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ amount: 700, scheme: 'upto' });
  });

  it('tags standalone settle + distribute as batch-settlement', () => {
    const tx = buildTx(
      [
        { discriminator: SETTLE, accounts },
        { discriminator: DISTRIBUTE, accounts },
      ],
      [{ source: escrow, destination: recipientAta, amount: '1200', atInstructionIndex: 1 }],
      new Map([[recipientAta, recipientOwner]])
    );

    const events = extractPayouts(tx, CHANNELS_PROGRAM, context);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ scheme: 'batch-settlement' });
  });

  it('skips payee and treasury legs and transfers not from the escrow', () => {
    const tx = buildTx(
      [{ discriminator: DISTRIBUTE, accounts }],
      [
        { source: escrow, destination: payeeAta, amount: '10', atInstructionIndex: 0 },
        { source: escrow, destination: treasuryAta, amount: '20', atInstructionIndex: 0 },
        { source: key(), destination: recipientAta, amount: '30', atInstructionIndex: 0 },
      ],
      new Map([[recipientAta, recipientOwner]])
    );

    expect(extractPayouts(tx, CHANNELS_PROGRAM, context)).toHaveLength(0);
  });

  it('emits nothing for channel transactions without a distribute', () => {
    const tx = buildTx(
      [{ discriminator: OPEN, accounts }],
      [{ source: escrow, destination: recipientAta, amount: '40', atInstructionIndex: 0 }],
      new Map([[recipientAta, recipientOwner]])
    );

    expect(extractPayouts(tx, CHANNELS_PROGRAM, context)).toHaveLength(0);
  });

  it('increments log_index across payout legs of batched distributes', () => {
    const secondRecipientAta = key();
    const secondRecipientOwner = key();
    const secondPayer = key();
    const secondEscrow = key();
    const secondAccounts = distributeAccounts({
      payer: secondPayer,
      escrow: secondEscrow,
      payerAta: key(),
      payeeAta,
      treasuryAta,
      recipients: [secondRecipientAta],
    });

    const tx = buildTx(
      [
        { discriminator: DISTRIBUTE, accounts },
        { discriminator: DISTRIBUTE, accounts: secondAccounts },
      ],
      [
        { source: escrow, destination: recipientAta, amount: '100', atInstructionIndex: 0 },
        { source: secondEscrow, destination: secondRecipientAta, amount: '200', atInstructionIndex: 1 },
      ],
      new Map([
        [recipientAta, recipientOwner],
        [secondRecipientAta, secondRecipientOwner],
      ])
    );

    const events = extractPayouts(tx, CHANNELS_PROGRAM, context);
    expect(events).toHaveLength(2);
    expect(events.map(e => e.log_index)).toEqual([0, 1]);
    expect(events.map(e => e.sender)).toEqual([
      payer.toBase58(),
      secondPayer.toBase58(),
    ]);
    expect(events.map(e => e.amount)).toEqual([100, 200]);
  });

  it('unwraps batch-wrapped transfers from the sealed distribute path', () => {
    // Real devnet shape: settle_and_seal + distribute emits one spl-token
    // `batch` inner instruction nesting the payout and the payer refund.
    const tx = buildTx(
      [
        { discriminator: SETTLE_AND_SEAL, accounts },
        { discriminator: DISTRIBUTE, accounts },
      ],
      [],
      new Map([[recipientAta, recipientOwner]])
    );
    (
      tx.meta as unknown as {
        innerInstructions: { index: number; instructions: unknown[] }[];
      }
    ).innerInstructions = [
      {
        index: 1,
        instructions: [
          {
            program: 'spl-token',
            programId: TOKEN_PROGRAM,
            parsed: {
              type: 'batch',
              info: {
                instructions: [
                  {
                    type: 'transferChecked',
                    info: {
                      source: escrow.toBase58(),
                      destination: recipientAta.toBase58(),
                      mint: USDC_SOLANA,
                      tokenAmount: { amount: '400000', decimals: 6 },
                    },
                  },
                  {
                    type: 'transferChecked',
                    info: {
                      source: escrow.toBase58(),
                      destination: payerAta.toBase58(),
                      mint: USDC_SOLANA,
                      tokenAmount: { amount: '300000', decimals: 6 },
                    },
                  },
                ],
              },
            },
          },
          {
            program: 'spl-token',
            programId: TOKEN_PROGRAM,
            parsed: {
              type: 'closeAccount',
              info: { account: escrow.toBase58() },
            },
          },
        ],
      },
    ];

    const events = extractPayouts(tx, CHANNELS_PROGRAM, context);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      amount: 400000,
      recipient: recipientOwner.toBase58(),
      scheme: 'upto',
      sender: payer.toBase58(),
    });
  });

  it('falls back to the destination address when no owner metadata exists', () => {
    const tx = buildTx(
      [{ discriminator: DISTRIBUTE, accounts }],
      [{ source: escrow, destination: recipientAta, amount: '50', atInstructionIndex: 0 }],
      new Map()
    );

    const events = extractPayouts(tx, CHANNELS_PROGRAM, context);
    expect(events).toHaveLength(1);
    expect(events[0]!.recipient).toBe(recipientAta.toBase58());
  });
});
