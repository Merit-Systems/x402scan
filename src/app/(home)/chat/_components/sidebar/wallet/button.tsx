'use client';

import { Bot } from 'lucide-react';

import { Avatar } from '@/components/ui/avatar';
import { SidebarMenuButton, useSidebar } from '@/components/ui/sidebar';
import { api } from '@/trpc/client';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  onClick?: () => void;
}

export const WalletButton: React.FC<Props> = ({ onClick }) => {
  const { open } = useSidebar();

  const { data: usdcBalance, isLoading: isLoadingUsdcBalance } =
    api.serverWallet.usdcBaseBalance.useQuery();

  return (
    <SidebarMenuButton
      size="lg"
      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
      onClick={onClick}
    >
      <Avatar src={null} fallback={<Bot className="size-5 m-1" />} />
      {open && (
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-medium">Agent Wallet</span>
          {isLoadingUsdcBalance ? (
            <Skeleton className="h-3 my-0.5 w-16" />
          ) : (
            <span className="text-xs">{`${usdcBalance?.toPrecision(3)} USDC`}</span>
          )}
        </div>
      )}
    </SidebarMenuButton>
  );
};

export const LoadingWalletButton = () => {
  return (
    <SidebarMenuButton size="lg" className="bg-transparent border">
      <Avatar src={null} fallback={<Bot className="size-5 m-1" />} />
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">Agent Wallet</span>
        <Skeleton className="h-3 mt-0.5 w-8" />
      </div>
    </SidebarMenuButton>
  );
};
