'use client';

import { Bot } from 'lucide-react';

import { useSession } from 'next-auth/react';

import { Skeleton } from '@/components/ui/skeleton';

import { PromptInputButton } from '@/components/ai-elements/prompt-input';

import { WalletDialog } from './dialog';

import { api } from '@/trpc/client';
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
      <AcknowledgedWalletButton />
    </WalletChainProvider>
  );
};

const AcknowledgedWalletButton = () => {
  return (
    <WalletDialog>
      <WalletButtonComponent>
        <span>Wallet</span>
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
