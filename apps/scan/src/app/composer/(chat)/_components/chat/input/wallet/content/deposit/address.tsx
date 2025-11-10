import { CopyCode } from '@/components/ui/copy-code';
import { api } from '@/trpc/client';

export const ServerWalletAddress = () => {
  const { data: address, isLoading: isLoadingAddress } =
    api.user.serverWallet.address.useQuery();

  return (
    <div className="flex flex-col gap-1">
      <span className="font-medium text-sm">Your Agent Wallet Address</span>
      <CopyCode
        code={address ?? ''}
        isLoading={isLoadingAddress}
        toastMessage="Address copied to clipboard"
      />
    </div>
  );
};
