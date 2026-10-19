import {
  assertIsTransactionWithinSizeLimit,
  assertIsTransactionWithBlockhashLifetime,
  getCompiledTransactionMessageDecoder,
  getCompiledTransactionMessageEncoder,
  isTransactionModifyingSigner,
  isTransactionPartialSigner,
} from '@solana/kit';
import type { Transaction, TransactionModifyingSigner } from '@solana/kit';
import type { ClientSvmSigner } from '@x402/svm';

const COMPUTE_BUDGET = 'ComputeBudget111111111111111111111111111111';
const MEMO = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
const TOKEN_PROGRAMS = new Set([
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
]);

// @x402/svm uses a 32-byte random nonce when the seller supplies no memo.
// Longer seller memos can exceed its fixed 20k CU budget. Keep the ordinary
// nonce path unchanged and use a bounded 60k budget for the longer memo path.
// This is not an estimate for arbitrary instructions or wallet additions.
const NONCE_MEMO_BYTES = 32;
const LONG_MEMO_COMPUTE_UNITS = 60_000;

function prepare(
  transaction: Parameters<
    TransactionModifyingSigner['modifyAndSignTransactions']
  >[0][number]
) {
  if (
    Object.values(transaction.signatures).some(signature =>
      signature?.some(byte => byte !== 0)
    )
  ) {
    throw new Error('Cannot adjust an already signed x402 transaction');
  }
  assertIsTransactionWithBlockhashLifetime(transaction);
  assertIsTransactionWithinSizeLimit(transaction);
  const message = getCompiledTransactionMessageDecoder().decode(
    transaction.messageBytes
  );
  const [limit, price, transfer, memo] = message.instructions;
  const program = (instruction: typeof limit) =>
    instruction && message.staticAccounts[instruction.programAddressIndex];
  if (
    message.version !== 0 ||
    message.addressTableLookups?.length ||
    message.instructions.length !== 4 ||
    program(limit) !== COMPUTE_BUDGET ||
    limit?.accountIndices?.length ||
    limit?.data?.length !== 5 ||
    limit.data[0] !== 2 ||
    new DataView(Uint8Array.from(limit.data).buffer).getUint32(1, true) !==
      20_000 ||
    program(price) !== COMPUTE_BUDGET ||
    price?.accountIndices?.length ||
    price?.data?.length !== 9 ||
    price.data[0] !== 3 ||
    !TOKEN_PROGRAMS.has(program(transfer) ?? '') ||
    transfer?.data?.length !== 10 ||
    transfer.data[0] !== 12 ||
    transfer.accountIndices?.length !== 4 ||
    program(memo) !== MEMO ||
    memo?.accountIndices?.length ||
    !memo?.data?.length ||
    memo.data.length > 256
  ) {
    throw new Error('Unexpected x402 transaction shape before wallet signing');
  }
  if (memo.data.length <= NONCE_MEMO_BYTES) return transaction;

  // Re-encode the same compiled message; only the limit's four-byte value changes.
  // No account, transfer, memo, priority fee, or lifetime is reconstructed.
  const data = Uint8Array.from(limit.data);
  new DataView(data.buffer).setUint32(1, LONG_MEMO_COMPUTE_UNITS, true);
  const adjusted = {
    ...transaction,
    messageBytes: getCompiledTransactionMessageEncoder().encode({
      ...message,
      instructions: [{ ...limit, data }, ...message.instructions.slice(1)],
    }) as Transaction['messageBytes'],
  };
  assertIsTransactionWithinSizeLimit(adjusted);
  return adjusted;
}

/** Adjust unsigned v2 payments before the wallet signs, never after signing. */
export function withSvmMemoComputeBudget(
  signer: ClientSvmSigner
): TransactionModifyingSigner {
  if (
    !isTransactionModifyingSigner(signer) &&
    !isTransactionPartialSigner(signer)
  ) {
    throw new Error('x402 requires a signer that signs without sending');
  }
  return {
    address: signer.address,
    async modifyAndSignTransactions(transactions, config) {
      config?.abortSignal?.throwIfAborted();
      // Validate the entire batch before any wallet interaction.
      const prepared = transactions.map(prepare);
      if (isTransactionModifyingSigner(signer)) {
        // Preserve the wallet's modifying-signer contract, including protective
        // instructions. Return the message the wallet actually signed.
        return signer.modifyAndSignTransactions(prepared, config);
      }
      const signatures = await signer.signTransactions(prepared, config);
      if (signatures.length !== prepared.length) {
        throw new Error('Wallet returned an unexpected signature count');
      }
      return prepared.map((transaction, index) => ({
        ...transaction,
        signatures: { ...transaction.signatures, ...signatures[index] },
      }));
    },
  };
}
