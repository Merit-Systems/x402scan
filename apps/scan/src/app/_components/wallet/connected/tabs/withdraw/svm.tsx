import { useCallback, useEffect, useState } from 'react';

import { useWalletAccountTransactionSendingSigner } from '@solana/react';

import { useMutation } from '@tanstack/react-query';
import { Check, Loader2 } from 'lucide-react';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { useSolanaWallet } from '@/app/_contexts/solana/hook';
import { useSPLTokenBalance } from '@/app/_hooks/balance/use-svm-balance';

import { USDC_ADDRESS } from '@/lib/utils';
import { solanaAddressSchema } from '@/lib/schemas';

import { Chain } from '@/types/chain';
import {
  appendTransactionMessageInstructions,
  createTransactionMessage,
  getBase58Decoder,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signAndSendTransactionMessageWithSigners,
} from '@solana/kit';
import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
  getTransferCheckedInstruction,
  getCreateAssociatedTokenIdempotentInstructionAsync,
} from '@solana-program/token';
import { address as solanaAddress } from '@solana/kit';
import type { UiWalletAccount } from '@wallet-standard/react';
import { api } from '@/trpc/client';

interface Props {
  amount: number;
  setAmount: (amount: number) => void;
  toAddress: string;
}

export const WithdrawSolana: React.FC<Props> = ({
  amount,
  setAmount,
  toAddress,
}) => {
  const { connectedWallet } = useSolanaWallet();

  if (!connectedWallet) {
    return <div>Connect your wallet to withdraw USDC</div>;
  }

  return (
    <WithdrawSolanaContent
      account={connectedWallet.account}
      amount={amount}
      setAmount={setAmount}
      toAddress={toAddress}
    />
  );
};

interface WithdrawContentProps extends Props {
  account: UiWalletAccount;
}

const WithdrawSolanaContent: React.FC<WithdrawContentProps> = ({
  account,
  amount,
  setAmount,
  toAddress,
}) => {
  const transactionSendingSigner = useWalletAccountTransactionSendingSigner(
    account,
    'solana:mainnet'
  );

  const { data: latestBlockhash } = api.public.solana.latestBlockhash.useQuery(
    undefined,
    {
      refetchInterval: 10000,
    }
  );

  const {
    data: usdcBalance,
    isLoading: isUsdcBalanceLoading,
    refetch: refetchBalance,
  } = useSPLTokenBalance();

  const {
    data: nativeBalance,
    isLoading: isLoadingNativeBalance,
    refetch: refetchNativeBalance,
  } = api.public.solana.nativeBalance.useQuery(account.address);

  const {
    mutate: sendTransaction,
    isPending: isSending,
    isSuccess: isSent,
    data: signature,
    reset: resetSendTransaction,
  } = useMutation({
    mutationFn: async ({
      recipientAddress,
      amount,
    }: {
      recipientAddress: string;
      amount: number;
    }) => {
      if (!latestBlockhash) {
        throw new Error('Latest blockhash not found');
      }

      const usdcMint = USDC_ADDRESS[Chain.SOLANA];
      const decimals = 6;
      const amountInRawUnits = BigInt(Math.floor(amount * 10 ** decimals));

      // Find source token account (sender's ATA)
      const [sourceTokenAccount] = await findAssociatedTokenPda({
        mint: solanaAddress(usdcMint),
        owner: solanaAddress(account.address),
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      });

      // Find destination token account (recipient's ATA)
      const [destinationTokenAccount] = await findAssociatedTokenPda({
        mint: solanaAddress(usdcMint),
        owner: solanaAddress(recipientAddress),
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      });

      const createAssociatedTokenInstruction =
        await getCreateAssociatedTokenIdempotentInstructionAsync({
          mint: solanaAddress(usdcMint),
          owner: solanaAddress(recipientAddress),
          payer: transactionSendingSigner,
        });

      // Create transferChecked instruction
      const transferInstruction = getTransferCheckedInstruction({
        source: sourceTokenAccount,
        mint: solanaAddress(usdcMint),
        destination: destinationTokenAccount,
        amount: amountInRawUnits,
        decimals,
        authority: solanaAddress(account.address),
      });

      const instructions = [
        createAssociatedTokenInstruction,
        transferInstruction,
      ];

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

      const signature =
        await signAndSendTransactionMessageWithSigners(transactionMessage);

      return getBase58Decoder().decode(signature);
    },
    onSuccess: () => {
      toast.success(`${amount} USDC sent`);
    },
    onError: error => {
      console.error('Failed to construct transaction:', error);
      toast.error('Failed to construct transaction', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  const [isConfirmed, setIsConfirmed] = useState(false);
  const { data: transactionConfirmation } =
    api.public.solana.transactionConfirmation.useQuery(signature ?? '', {
      enabled: !!signature,
      refetchInterval: isConfirmed ? undefined : 1000,
    });

  useEffect(() => {
    console.log(transactionConfirmation);
    if (transactionConfirmation?.confirmationStatus === 'confirmed') {
      setIsConfirmed(true);

      setTimeout(() => {
        resetSendTransaction();
        setIsConfirmed(false);
        setAmount(0);
      }, 2000);

      // Refetch balances 5 times with exponential backoff (1s, 2s, 4s, 8s, 16s) after confirmation
      let count = 0;
      const maxRetries = 5;
      const baseDelay = 1000; // 1 second

      function refetchWithBackoff() {
        void refetchBalance();
        void refetchNativeBalance();
        count += 1;
        if (count < maxRetries) {
          setTimeout(refetchWithBackoff, baseDelay * 2 ** count);
        }
      }

      refetchWithBackoff();
    }
  }, [
    transactionConfirmation,
    refetchBalance,
    refetchNativeBalance,
    resetSendTransaction,
    setAmount,
  ]);

  const handleSubmit = useCallback(() => {
    const parseResult = solanaAddressSchema.safeParse(toAddress);
    if (!parseResult.success) {
      toast.error('Invalid Solana address');
      return;
    }

    sendTransaction({
      recipientAddress: parseResult.data,
      amount,
    });
  }, [toAddress, amount, sendTransaction]);

  return (
    <>
      <Button
        variant="turbo"
        disabled={
          amount === 0 ||
          !toAddress ||
          !solanaAddressSchema.safeParse(toAddress).success ||
          isSending ||
          isSent ||
          !usdcBalance ||
          usdcBalance < amount ||
          isUsdcBalanceLoading ||
          isLoadingNativeBalance ||
          !nativeBalance ||
          nativeBalance < 0.0001 ||
          !latestBlockhash
        }
        onClick={handleSubmit}
      >
        {isSending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Sending...
          </>
        ) : isSent ? (
          <>
            <Check className="size-4" />
            Waiting for Confirmation...
          </>
        ) : isConfirmed ? (
          <>
            <Check className="size-4" />
            USDC sent
          </>
        ) : (
          'Send USDC'
        )}
      </Button>
    </>
  );
};
