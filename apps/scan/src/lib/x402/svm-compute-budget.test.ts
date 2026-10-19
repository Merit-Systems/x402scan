import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  address,
  generateKeyPairSigner,
  getBase64Encoder,
  getCompiledTransactionMessageDecoder,
  getCompiledTransactionMessageEncoder,
  getPublicKeyFromAddress,
  getTransactionDecoder,
  verifySignature,
} from '@solana/kit';
import type {
  CompiledTransactionMessage,
  Transaction,
  TransactionModifyingSigner,
} from '@solana/kit';
import { ExactSvmScheme } from '@x402/svm/exact/client';
import type { PaymentRequirements } from '@x402/core/types';

import { withSvmMemoComputeBudget } from './svm-compute-budget';
import { registerSvmX402Client } from './wrap-fetch';

const RPC = 'https://offline-rpc.invalid';
type WalletTransaction = Parameters<
  TransactionModifyingSigner['modifyAndSignTransactions']
>[0][number];
const decode = (tx: Transaction) =>
  getCompiledTransactionMessageDecoder().decode(tx.messageBytes);
const units = (tx: Transaction) =>
  new DataView(
    Uint8Array.from(decode(tx).instructions[0]!.data!).buffer
  ).getUint32(1, true);

function change(
  tx: WalletTransaction,
  mutate: (message: ReturnType<typeof decode>) => CompiledTransactionMessage
): WalletTransaction {
  return {
    ...tx,
    messageBytes: getCompiledTransactionMessageEncoder().encode(
      mutate(decode(tx))
    ) as Transaction['messageBytes'],
  };
}

async function fixture(
  memo: string | null = 'request-bound:'.padEnd(117, 'a')
) {
  const payer = await generateKeyPairSigner();
  const feePayer = await generateKeyPairSigner();
  const recipient = await generateKeyPairSigner();
  const rpcMethods: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      expect(String(url)).toBe(RPC);
      const body = JSON.parse(String(init?.body)) as {
        id: string;
        method: string;
      };
      rpcMethods.push(body.method);
      let result;
      if (body.method === 'getAccountInfo') {
        const mint = Buffer.alloc(82);
        mint[44] = 6;
        mint[45] = 1;
        result = {
          context: { slot: 1 },
          value: {
            data: [mint.toString('base64'), 'base64'],
            executable: false,
            lamports: 1461600,
            owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            rentEpoch: 1,
            space: 82,
          },
        };
      } else if (body.method === 'getLatestBlockhash') {
        result = {
          context: { slot: 1 },
          value: {
            blockhash: feePayer.address,
            lastValidBlockHeight: 123456789,
          },
        };
      } else {
        throw new Error(`Unexpected RPC method: ${body.method}`);
      }
      return new Response(
        JSON.stringify({ jsonrpc: '2.0', id: body.id, result }),
        { headers: { 'content-type': 'application/json' } }
      );
    })
  );
  const signTransactions = vi.fn(payer.signTransactions);
  const signer = { address: payer.address, signTransactions };
  const requirements: PaymentRequirements = {
    scheme: 'exact',
    network: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    amount: '14304',
    payTo: recipient.address,
    maxTimeoutSeconds: 90,
    extra: { feePayer: feePayer.address, ...(memo === null ? {} : { memo }) },
  };
  const original = await new ExactSvmScheme(signer, {
    rpcUrl: RPC,
  }).createPaymentPayload(2, requirements);
  const unsigned = signTransactions.mock.calls[0]![0][0]!;
  signTransactions.mockClear();
  return {
    signer,
    payer,
    requirements,
    unsigned,
    original,
    signTransactions,
    rpcMethods,
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('unsigned SVM memo compute budget', () => {
  it('changes only the limit before a real partial signer signs; preserves lifetime and AbortSignal', async () => {
    const f = await fixture();
    const before = Uint8Array.from(f.unsigned.messageBytes);
    const config = { abortSignal: new AbortController().signal };
    const [signed] = await withSvmMemoComputeBudget(
      f.signer
    ).modifyAndSignTransactions([f.unsigned], config);
    expect(units(signed!)).toBe(60_000);
    expect(f.signTransactions).toHaveBeenCalledOnce();
    expect(f.signTransactions.mock.calls[0]![1]).toBe(config);
    expect(signed!.lifetimeConstraint).toBe(f.unsigned.lifetimeConstraint);
    expect(f.unsigned.messageBytes).toEqual(before);
    const restored = change(signed!, message => {
      const limit = message.instructions[0]!;
      const data = Uint8Array.from(limit.data!);
      new DataView(data.buffer).setUint32(1, 20_000, true);
      return {
        ...message,
        instructions: [{ ...limit, data }, ...message.instructions.slice(1)],
      };
    });
    expect(restored.messageBytes).toEqual(before);
    expect(
      await verifySignature(
        await getPublicKeyFromAddress(f.payer.address),
        signed!.signatures[f.payer.address]!,
        signed!.messageBytes
      )
    ).toBe(true);
    expect(f.rpcMethods).toEqual(['getAccountInfo', 'getLatestBlockhash']);
  });

  it.each([null, 'a'.repeat(1), 'a'.repeat(31), 'a'.repeat(32)])(
    'preserves the default or short memo transaction (%s)',
    async memo => {
      const f = await fixture(memo);
      const [signed] = await withSvmMemoComputeBudget(
        f.signer
      ).modifyAndSignTransactions([f.unsigned]);
      expect(units(signed!)).toBe(20_000);
      expect(signed!.messageBytes).toEqual(f.unsigned.messageBytes);
    }
  );

  it.each(['a'.repeat(33), 'é'.repeat(17), 'a'.repeat(117), 'a'.repeat(256)])(
    'uses encoded memo bytes for the longer memo path (%s)',
    async memo => {
      const f = await fixture(memo);
      const [signed] = await withSvmMemoComputeBudget(
        f.signer
      ).modifyAndSignTransactions([f.unsigned]);
      expect(units(signed!)).toBe(60_000);
      expect(decode(signed!).instructions[3]!.data).toEqual(
        new TextEncoder().encode(memo)
      );
    }
  );

  it('rejects a pre-signed batch before any wallet call', async () => {
    const f = await fixture();
    const signed = getTransactionDecoder().decode(
      getBase64Encoder().encode(f.original.payload.transaction as string)
    );
    await expect(
      withSvmMemoComputeBudget(f.signer).modifyAndSignTransactions([
        f.unsigned,
        { ...signed, lifetimeConstraint: f.unsigned.lifetimeConstraint },
      ])
    ).rejects.toThrow('already signed');
    expect(f.signTransactions).not.toHaveBeenCalled();
  });

  it('refuses duplicate, noncanonical, or unexpected instructions before signing', async () => {
    const f = await fixture();
    const mutations: ((
      m: ReturnType<typeof decode>
    ) => CompiledTransactionMessage)[] = [
      m => ({ ...m, instructions: [...m.instructions, m.instructions[0]!] }),
      m => ({
        ...m,
        instructions: [
          { ...m.instructions[0]!, data: new Uint8Array([2, 0, 0, 0, 0]) },
          ...m.instructions.slice(1),
        ],
      }),
      m => ({
        ...m,
        instructions: [
          { ...m.instructions[0]!, accountIndices: [0] },
          ...m.instructions.slice(1),
        ],
      }),
      m => ({
        ...m,
        instructions: [
          m.instructions[1]!,
          m.instructions[0]!,
          ...m.instructions.slice(2),
        ],
      }),
      m => ({
        ...m,
        instructions: [
          ...m.instructions.slice(0, 3),
          { ...m.instructions[3]!, data: new Uint8Array(257) },
        ],
      }),
      m => ({
        ...m,
        instructions: [
          ...m.instructions.slice(0, 2),
          { ...m.instructions[2]!, accountIndices: [0] },
          m.instructions[3]!,
        ],
      }),
    ];
    for (const mutate of mutations) {
      await expect(
        withSvmMemoComputeBudget(f.signer).modifyAndSignTransactions([
          change(f.unsigned, mutate),
        ])
      ).rejects.toThrow('Unexpected x402 transaction shape');
    }
    expect(f.signTransactions).not.toHaveBeenCalled();
  });

  it('preserves modifying-signer results instead of stripping wallet protective instructions', async () => {
    const f = await fixture();
    const config = { abortSignal: new AbortController().signal };
    let walletResult: WalletTransaction | undefined;
    const modifyAndSignTransactions: TransactionModifyingSigner['modifyAndSignTransactions'] =
      vi.fn(async (transactions, receivedConfig) => {
        expect(receivedConfig).toBe(config);
        expect(units(transactions[0]!)).toBe(60_000);
        const modified = change(transactions[0]!, m => ({
          ...m,
          header: {
            ...m.header,
            numReadonlyNonSignerAccounts:
              m.header.numReadonlyNonSignerAccounts + 1,
          },
          staticAccounts: [
            ...m.staticAccounts,
            address('L2TExMFKdjpN9kozasaurPirfHy9P8sbXoAN1qA3S95'),
          ],
          instructions: [
            ...m.instructions,
            {
              programAddressIndex: m.staticAccounts.length,
              data: new Uint8Array(),
              accountIndices: [],
            },
          ],
        }));
        // The existing wallet owns its modifications. This fixture checks that
        // the adapter returns the message it signs, not that a facilitator accepts it.
        const signatures = await f.payer.signTransactions([
          modified as typeof f.unsigned,
        ]);
        walletResult = {
          ...modified,
          signatures: { ...modified.signatures, ...signatures[0] },
        };
        return [
          walletResult as Awaited<
            ReturnType<TransactionModifyingSigner['modifyAndSignTransactions']>
          >[number],
        ];
      });
    const [signed] = await withSvmMemoComputeBudget({
      address: f.payer.address,
      modifyAndSignTransactions,
    }).modifyAndSignTransactions([f.unsigned], config);
    expect(signed).toBe(walletResult);
    expect(decode(signed!).instructions).toHaveLength(5);
    expect(
      await verifySignature(
        await getPublicKeyFromAddress(f.payer.address),
        signed!.signatures[f.payer.address]!,
        signed!.messageBytes
      )
    ).toBe(true);
  });

  it('refuses an aborted request and a sending-only signer without wallet interaction', async () => {
    const f = await fixture();
    const controller = new AbortController();
    controller.abort();
    await expect(
      withSvmMemoComputeBudget(f.signer).modifyAndSignTransactions(
        [f.unsigned],
        { abortSignal: controller.signal }
      )
    ).rejects.toThrow();
    expect(f.signTransactions).not.toHaveBeenCalled();
    const signAndSendTransactions = vi.fn();
    expect(() =>
      withSvmMemoComputeBudget({
        address: f.payer.address,
        signAndSendTransactions,
      })
    ).toThrow('without sending');
    expect(signAndSendTransactions).not.toHaveBeenCalled();
  });

  it('wires the actual x402 client v2 assembly while leaving v1 untouched', async () => {
    const f = await fixture();
    const client = registerSvmX402Client({ signer: f.signer, rpcUrl: RPC });
    const payload = await client.createPaymentPayload({
      x402Version: 2,
      resource: { url: 'https://example.invalid/inference' },
      accepts: [f.requirements],
    });
    const v2 = getTransactionDecoder().decode(
      getBase64Encoder().encode(payload.payload.transaction as string)
    );
    expect(units(v2)).toBe(60_000);
    expect(payload.accepted).toEqual(f.requirements);
    expect(decode(v2).instructions[3]!.data).toEqual(
      new TextEncoder().encode(f.requirements.extra!.memo as string)
    );
    // The runtime supports v1 while this version's public TypeScript input is v2-only.
    const v1Payload = await client.createPaymentPayload({
      x402Version: 1,
      accepts: [
        {
          ...f.requirements,
          network: 'solana',
          maxAmountRequired: f.requirements.amount,
          resource: 'https://example.invalid/inference',
          description: '',
          mimeType: 'application/json',
        },
      ],
    } as unknown as Parameters<typeof client.createPaymentPayload>[0]);
    const v1 = getTransactionDecoder().decode(
      getBase64Encoder().encode(v1Payload.payload.transaction as string)
    );
    expect(units(v1)).toBe(20_000);
    expect(
      f.rpcMethods.every(method =>
        ['getAccountInfo', 'getLatestBlockhash'].includes(method)
      )
    ).toBe(true);
    expect(f.signTransactions).toHaveBeenCalledTimes(2);
  });
});
