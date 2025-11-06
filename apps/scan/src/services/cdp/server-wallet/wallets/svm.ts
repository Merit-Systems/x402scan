import {
  address,
  getBase64EncodedWireTransaction,
  getTransactionCodec,
  getBase64Encoder,
} from '@solana/kit';
import {
  assertIsTransactionWithinSizeLimit,
  getTransactionLifetimeConstraintFromCompiledTransactionMessage,
} from '@solana/transactions';
import { getCompiledTransactionMessageDecoder } from '@solana/transaction-messages';

import { cdpClient } from '../client';

import {
  getSolanaNativeBalance,
  getSolanaTokenBalance,
} from '@/services/solana/balance';

import type { Chain } from '@/types/chain';
import type { TransactionModifyingSigner } from '@solana/kit';
import type { NetworkServerWallet } from './types';
import type { SolanaAddress } from '@/types/address';

export const svmServerWallet: NetworkServerWallet<Chain.SOLANA> = (
  name: string
) => {
  const getAccount = async () => {
    return cdpClient.solana.getOrCreateAccount({
      name,
    });
  };

  const getAddress = async () => (await getAccount()).address as SolanaAddress;

  return {
    address: getAddress,
    getNativeTokenBalance: async () =>
      getSolanaNativeBalance(await getAddress()),
    getTokenBalance: async ({ token }) =>
      getSolanaTokenBalance({
        ownerAddress: await getAddress(),
        tokenMint: token.address as SolanaAddress,
      }),
    export: async () => {
      return cdpClient.solana.exportAccount({
        address: await getAddress(),
        name,
      });
    },
    signer: async () => getModifyingSigner(await getAccount()),
    sendTokens: async () => {
      return 'Not implemented';
    },
  };
};

const getModifyingSigner = (
  account: Awaited<ReturnType<typeof cdpClient.solana.getOrCreateAccount>>
): TransactionModifyingSigner => {
  const base64Encoder = getBase64Encoder();
  const transactionCodec = getTransactionCodec();
  const compiledMessageDecoder = getCompiledTransactionMessageDecoder();

  return {
    address: address(account.address),
    modifyAndSignTransactions: async transactions => {
      const signedTransactions = await Promise.all(
        transactions.map(async transaction => {
          // Serialize transaction to base64 for CDP signing
          const base64Transaction =
            getBase64EncodedWireTransaction(transaction);

          // Sign with CDP
          const { signedTransaction } = await account.signTransaction({
            transaction: base64Transaction,
          });

          console.log('signedTransaction', signedTransaction);

          // Decode the base58-encoded signed transaction to bytes
          const signedTransactionBytes =
            base64Encoder.encode(signedTransaction);

          // Deserialize bytes back to Transaction object
          const decodedSignedTransaction = transactionCodec.decode(
            signedTransactionBytes
          );

          // Assert the transaction is within size limit
          assertIsTransactionWithinSizeLimit(decodedSignedTransaction);

          // Add lifetime constraint from the compiled transaction message
          const compiledTransactionMessage = compiledMessageDecoder.decode(
            decodedSignedTransaction.messageBytes
          );
          const lifetimeConstraint =
            await getTransactionLifetimeConstraintFromCompiledTransactionMessage(
              compiledTransactionMessage
            );

          return {
            ...decodedSignedTransaction,
            lifetimeConstraint,
          };
        })
      );
      return signedTransactions;
    },
  };
};
