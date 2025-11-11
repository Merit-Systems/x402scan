import { CopyCode } from '@/components/ui/copy-code';

import { api } from '@/trpc/client';

import type { SupportedChain } from '@/types/chain';

interface Props {
  chain: SupportedChain;
}

export const ServerWalletAddress: React.FC<Props> = () => {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-medium text-sm">Your Composer Wallet Address</span>
      <ComposerWalletAddressCopyCode />
    </div>
  );
};

export const ComposerWalletAddressCopyCode: React.FC = () => {
  const { data: address, isLoading: isLoadingAddress } =
    api.user.serverWallet.address.useQuery();

  return (
    <CopyCode
      code={address ?? ''}
      isLoading={isLoadingAddress}
      toastMessage="Address copied to clipboard"
    />
  );
};
