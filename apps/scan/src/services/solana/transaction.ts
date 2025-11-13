import { signature } from '@solana/kit';

import { solanaRpc } from './rpc';

export const getSolanaTransactionConfirmation = async (sig: string) => {
  const {
    value: [confirmation],
  } = await solanaRpc.getSignatureStatuses([signature(sig)]).send();
  return confirmation;
};

interface WaitForSolanaTransactionConfirmationProps {
  sig: string;
  interval?: number;
  maxRetries?: number;
}

export const waitForSolanaTransactionConfirmation = async ({
  sig,
  interval = 1000,
  maxRetries = 25,
}: WaitForSolanaTransactionConfirmationProps): Promise<boolean> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const confirmation = await getSolanaTransactionConfirmation(sig);
    if (confirmation?.confirmationStatus === 'confirmed') {
      return true;
    }
    if (attempt < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  return false;
};
