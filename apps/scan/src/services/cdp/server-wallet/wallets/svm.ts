import {
  address,
  getBase64EncodedWireTransaction,
  getTransactionCodec,
  getBase64Encoder,
  appendTransactionMessageInstructions,
  createTransactionMessage,
  getBase58Decoder,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  address as solanaAddress,
} from '@solana/kit';
import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
  getTransferCheckedInstruction,
  getCreateAssociatedTokenIdempotentInstructionAsync,
} from '@solana-program/token';
import {
  assertIsTransactionWithinSizeLimit,
  compileTransaction,
  getTransactionLifetimeConstraintFromCompiledTransactionMessage,
} from '@solana/transactions';
import { getCompiledTransactionMessageDecoder } from '@solana/transaction-messages';

import { cdpClient } from '../client';

import {
  getSolanaNativeBalance,
  getSolanaTokenBalance,
} from '@/services/solana/balance';
import { solanaRpc } from '@/services/rpc/solana';

import { cdpResultFromPromise } from '../../result';

import type { Chain } from '@/types/chain';
import type { TransactionModifyingSigner } from '@solana/kit';
import type { NetworkServerWallet } from './types';
import type { SolanaAddress } from '@/types/address';
import type { Signer } from 'x402-fetch';

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
    address: () =>
      cdpResultFromPromise(getAddress(), 'Failed to get wallet address'),
    getNativeTokenBalance: () =>
      cdpResultFromPromise(
        getAddress().then(address => getSolanaNativeBalance(address)),
        'Failed to get native token balance'
      ),
    getTokenBalance: ({ token }) =>
      cdpResultFromPromise(
        getAddress().then(address =>
          getSolanaTokenBalance({
            ownerAddress: address,
            tokenMint: token.address as SolanaAddress,
          })
        ),
        'Failed to get token balance'
      ),
    export: () =>
      cdpResultFromPromise(
        getAddress().then(address =>
          cdpClient.solana.exportAccount({
            address,
            name,
          })
        ),
        'Failed to export wallet'
      ),
    signer: async () => getModifyingSigner(await getAccount()) as Signer,
    sendTokens: ({ address, token, amount }) =>
      cdpResultFromPromise(
        (async () => {
          const account = await getAccount();

          const mint = solanaAddress(token.address);

          const signer = getModifyingSigner(account);

          const [sourceTokenAccount] = await findAssociatedTokenPda({
            mint,
            owner: solanaAddress(account.address),
            tokenProgram: TOKEN_PROGRAM_ADDRESS,
          });

          // Find destination token account (recipient's ATA)
          const [destinationTokenAccount] = await findAssociatedTokenPda({
            mint,
            owner: solanaAddress(address),
            tokenProgram: TOKEN_PROGRAM_ADDRESS,
          });

          const createAssociatedTokenInstruction =
            await getCreateAssociatedTokenIdempotentInstructionAsync({
              mint,
              owner: solanaAddress(address),
              payer: signer,
            });

          // Create transferChecked instruction
          const transferInstruction = getTransferCheckedInstruction({
            source: sourceTokenAccount,
            mint,
            destination: destinationTokenAccount,
            amount: BigInt(Math.floor(amount * 10 ** token.decimals)),
            decimals: token.decimals,
            authority: solanaAddress(account.address),
          });

          const instructions = [
            createAssociatedTokenInstruction,
            transferInstruction,
          ];

          const { value: latestBlockhash } = await solanaRpc
            .getLatestBlockhash()
            .send();

          const transactionMessage = pipe(
            createTransactionMessage({ version: 0 }),
            message =>
              setTransactionMessageLifetimeUsingBlockhash(
                latestBlockhash,
                message
              ),
            message => setTransactionMessageFeePayerSigner(signer, message),
            message =>
              appendTransactionMessageInstructions(instructions, message)
          );

          const compiledTransaction = compileTransaction(transactionMessage);

          const base64Transaction =
            getBase64EncodedWireTransaction(compiledTransaction);

          const { transactionSignature } = await account.sendTransaction({
            network: 'solana',
            transaction: base64Transaction,
          });

          const base64Encoder = getBase64Encoder();
          const transactionSignatureBytes =
            base64Encoder.encode(transactionSignature);
          const base58Decoder = getBase58Decoder();
          const transactionSignatureBase58 = base58Decoder.decode(
            transactionSignatureBytes
          );

          return transactionSignatureBase58;
        })(),
        'Failed to send tokens'
      ),
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
          const base64Transaction =
            getBase64EncodedWireTransaction(transaction);

          const { signedTransaction } = await account.signTransaction({
            transaction: base64Transaction,
          });

          const signedTransactionBytes =
            base64Encoder.encode(signedTransaction);

          const decodedSignedTransaction = transactionCodec.decode(
            signedTransactionBytes
          );

          assertIsTransactionWithinSizeLimit(decodedSignedTransaction);

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
