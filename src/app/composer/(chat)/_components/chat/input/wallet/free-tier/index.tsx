import { api } from '@/trpc/client';
import { LoadingWalletButton } from '../button';
import { OutOfFreeTier } from './out-of-free-tier';
import { FreeTierDialog } from './dialog';
import { FreeTierButtonContent } from './button';

interface Props {
  hideFreeTierButton: () => void;
}

export const FreeTierButton: React.FC<Props> = ({ hideFreeTierButton }) => {
  const { data: freeTierUsage, isLoading } = api.user.freeTier.usage.useQuery();

  const { data: address, isLoading: isAddressLoading } =
    api.user.serverWallet.address.useQuery();

  if (isLoading) {
    return <LoadingWalletButton />;
  }

  if (!freeTierUsage?.hasFreeTier) {
    if (isAddressLoading) {
      return <FreeTierButtonContent />;
    }
    if (!address) {
      return null;
    }
    return (
      <OutOfFreeTier
        address={address}
        hideFreeTierButton={hideFreeTierButton}
      />
    );
  }

  return (
    <FreeTierDialog
      numMessages={freeTierUsage.messageCount}
      numToolCalls={freeTierUsage.toolCallCount}
    />
  );
};
