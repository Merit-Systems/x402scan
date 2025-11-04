import { signature } from '@solana/kit';

import { solanaRpc } from './rpc';

export const getSolanaTransactionConfirmation = async (sig: string) => {
  const {
    value: [confirmation],
  } = await solanaRpc.getSignatureStatuses([signature(sig)]).send();
  return confirmation;
};
