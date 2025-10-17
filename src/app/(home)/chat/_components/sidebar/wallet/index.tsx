import { api } from '@/trpc/server';
import { WalletButton } from './button';
import { WalletDialog } from '../../wallet/dialog';
import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';

export const Wallet = async () => {
  const address = await api.serverWallet.address();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <WalletDialog address={address}>
          <WalletButton />
        </WalletDialog>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
