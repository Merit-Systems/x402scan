'use client';

import { Bot } from 'lucide-react';

import { useSession } from 'next-auth/react';

import { Loading } from '@/components/ui/loading';
import { Skeleton } from '@/components/ui/skeleton';

import { PromptInputButton } from '@/components/ai-elements/prompt-input';

import { WalletDialog } from './dialog';

import { api } from '@/trpc/client';
import { useWalletChain } from '@/app/_contexts/wallet-chain/hook';
import { WalletChainProvider } from '@/app/_contexts/wallet-chain/provider';

export const WalletButton = () => {
  const { data: session } = useSession();

  const {
    data: hasUserAcknowledgedComposer,
    isLoading: isLoadingHasUserAcknowledgedComposer,
  } = api.user.acknowledgements.hasAcknowledged.useQuery(undefined, {
    enabled: !!session,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  if (isLoadingHasUserAcknowledgedComposer) {
    return <LoadingWalletButton />;
  }

  if (!hasUserAcknowledgedComposer) {
    return <WalletButtonComponent disabled>Welcome</WalletButtonComponent>;
  }

  return (
    <WalletChainProvider>
      <AcknowledgedWalletButton isLoggedIn={!!session} />
    </WalletChainProvider>
  );
};

const AcknowledgedWalletButton = ({ isLoggedIn }: { isLoggedIn: boolean }) => {
  const { chain } = useWalletChain();

  const { data: usdcBalance, isLoading: isLoadingUsdcBalance } =
    api.user.serverWallet.tokenBalance.useQuery(
      {
        chain,
      },
      {
        enabled: isLoggedIn,
      }
    );

  return (
    <WalletDialog>
      <WalletButtonComponent
        className={
          usdcBalance !== undefined && usdcBalance < 0.1
            ? 'text-primary bg-primary/10 border-primary'
            : ''
        }
      >
        <Loading
          isLoading={isLoadingUsdcBalance}
          value={usdcBalance}
          component={balance =>
            balance < 0.1 ? 'Add Funds' : `${balance?.toPrecision(3)} USDC`
          }
          loadingComponent={<LoadingWalletButtonContent />}
        />
      </WalletButtonComponent>
    </WalletDialog>
  );
};

interface WalletButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const WalletButtonComponent: React.FC<WalletButtonProps> = ({
  children,
  onClick,
  className,
  disabled,
}) => {
  return (
    <PromptInputButton
      variant="outline"
      size="sm"
      onClick={onClick}
      className={className}
      disabled={disabled}
    >
      <Bot className="size-4" />
      <div className="text-xs">{children}</div>
    </PromptInputButton>
  );
};

const LoadingWalletButton = () => {
  return (
    <WalletButtonComponent disabled>
      <LoadingWalletButtonContent />
    </WalletButtonComponent>
  );
};

const LoadingWalletButtonContent = () => {
  return <Skeleton className="h-3 w-8" />;
};
