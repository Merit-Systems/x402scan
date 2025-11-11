import { useMutation } from '@tanstack/react-query';

import { useWalletAccountTransactionSendingSigner } from '@solana/react';
import {
  appendTransactionMessageInstructions,
  createTransactionMessage,
  getBase58Decoder,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signAndSendTransactionMessageWithSigners,
  address as solanaAddress,
} from '@solana/kit';
import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
  getTransferCheckedInstruction,
  getCreateAssociatedTokenIdempotentInstructionAsync,
} from '@solana-program/token';

import { useSPLTokenBalance } from '../balance/token/use-svm-token-balance';
import { useSolanaNativeBalance } from '../balance/native/use-svm-balance';

import { usdc } from '@/lib/tokens/usdc';
import { Chain } from '@/types/chain';

import type { Token } from '@/types/token';
import type { SolanaAddress } from '@/types/address';
import type { UiWalletAccount } from '@wallet-standard/react';
import { solanaRpc } from '@/services/solana/rpc';
import { toast } from 'sonner';
import { useCallback, useMemo, useState } from 'react';
import { waitForSolanaTransactionConfirmation } from '@/services/solana/transaction';
import { solanaAddressSchema } from '@/lib/schemas';

interface Props {
  account: UiWalletAccount;
  token?: Token;
  onSuccess?: () => void;
  toastMessage?: (amount: number) => string;
  address?: SolanaAddress;
  amount?: number;
}

export const useSvmSend = ({
  account,
  token = usdc(Chain.SOLANA),
  onSuccess,
  toastMessage,
  address: addressProp,
  amount: amountProp,
}: Props) => {
  const [amountState, setAmount] = useState<number>();
  const [toAddressState, setToAddress] = useState<string>();

  const amount = useMemo(
    () => amountProp ?? amountState,
    [amountProp, amountState]
  );

  const toAddress = useMemo(
    () => addressProp ?? toAddressState,
    [addressProp, toAddressState]
  );

  const transactionSendingSigner = useWalletAccountTransactionSendingSigner(
    account,
    'solana:mainnet'
  );

  const {
    data: usdcBalance,
    isLoading: isUsdcBalanceLoading,
    invalidate: invalidateBalance,
  } = useSPLTokenBalance({
    tokenMint: token.address,
    address: account.address as SolanaAddress,
  });

  const {
    data: solBalance,
    isLoading: isLoadingSolBalance,
    invalidate: invalidateSolBalance,
  } = useSolanaNativeBalance({
    address: account.address as SolanaAddress,
  });

  const {
    mutate: sendTransaction,
    isPending: isSending,
    isSuccess: isSent,
  } = useMutation({
    mutationFn: async ({
      recipientAddress,
      amount,
    }: {
      recipientAddress: string;
      amount: number;
    }) => {
      const mint = solanaAddress(token.address);
      const amountInRawUnits = BigInt(
        Math.floor(amount * 10 ** token.decimals)
      );

      // Find source token account (sender's ATA)
      const [sourceTokenAccount] = await findAssociatedTokenPda({
        mint,
        owner: solanaAddress(account.address),
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      });

      // Find destination token account (recipient's ATA)
      const [destinationTokenAccount] = await findAssociatedTokenPda({
        mint,
        owner: solanaAddress(recipientAddress),
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      });

      const createAssociatedTokenInstruction =
        await getCreateAssociatedTokenIdempotentInstructionAsync({
          mint,
          owner: solanaAddress(recipientAddress),
          payer: transactionSendingSigner,
        });

      // Create transferChecked instruction
      const transferInstruction = getTransferCheckedInstruction({
        source: sourceTokenAccount,
        mint,
        destination: destinationTokenAccount,
        amount: amountInRawUnits,
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
          setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, message),
        message =>
          setTransactionMessageFeePayerSigner(
            transactionSendingSigner,
            message
          ),
        message => appendTransactionMessageInstructions(instructions, message)
      );

      const signatureBytes =
        await signAndSendTransactionMessageWithSigners(transactionMessage);

      const signatureString = getBase58Decoder().decode(signatureBytes);

      const isConfirmed = await waitForSolanaTransactionConfirmation({
        sig: signatureString,
      });
      if (!isConfirmed) {
        throw new Error('Transaction not confirmed');
      }
      return signatureString;
    },
    onSuccess: () => {
      toast.success(
        toastMessage ? toastMessage(amountProp!) : `${amountProp} USDC sent`
      );
      void invalidateBalance();
      void invalidateSolBalance();
      onSuccess?.();
    },
    onError: error => {
      console.error('Failed to construct transaction:', error);
      toast.error('Failed to construct transaction', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  const handleSubmit = useCallback(() => {
    const parseResult = solanaAddressSchema.safeParse(toAddress);
    if (!parseResult.success) {
      toast.error('Invalid Solana address');
      return;
    }

    if (!amount) {
      toast.error('Amount is required');
      return;
    }

    sendTransaction({
      recipientAddress: parseResult.data,
      amount,
    });
  }, [toAddress, amount, sendTransaction]);

  const statusText = useMemo(() => {
    if (isUsdcBalanceLoading || isLoadingSolBalance) return 'Loading...';
    if (!solBalance) return 'Insufficient SOL';
    if (!amount) return 'Enter an amount';
    if (!usdcBalance || usdcBalance < amount) return 'Insufficient USDC';
    if (isSending) return 'Sending...';
    if (isSent) return 'USDC sent';
    return 'Send USDC';
  }, [
    isUsdcBalanceLoading,
    isLoadingSolBalance,
    solBalance,
    usdcBalance,
    amount,
    isSending,
    isSent,
  ]);

  return {
    handleSubmit,
    toAddress,
    setToAddress,
    amount,
    setAmount,
    isSending,
    isSent,
    isInvalid:
      !amount ||
      !usdcBalance ||
      usdcBalance < amount ||
      isUsdcBalanceLoading ||
      isLoadingSolBalance ||
      !solBalance,
    isPending: isSending,
    statusText,
    solBalance,
    isLoadingSolBalance,
  };
};
