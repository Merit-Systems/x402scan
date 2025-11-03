import { TabsContent } from '@/components/ui/tabs';
import { WalletContent } from './tabs/display';

import type { User } from '@coinbase/cdp-hooks';
import { Deposit } from './tabs/deposit';
import { Withdraw } from './tabs/withdraw/withdraw';
import { ExportWallet } from './tabs/export-wallet';

interface Props {
  user?: User;
  address: string;
}

export const ConnectedWalletTabsContent = ({ user, address }: Props) => {
  return (
    <>
      <TabsContent value="wallet" className="px-4 w-full overflow-hidden mt-0">
        <WalletContent user={user} address={address} />
      </TabsContent>
      <TabsContent value="deposit" className="px-4 w-full overflow-hidden mt-0">
        <Deposit address={address} />
      </TabsContent>
      <TabsContent
        value="withdraw"
        className="px-4 w-full overflow-hidden mt-0"
      >
        <Withdraw address={address} />
      </TabsContent>
      {user && (
        <TabsContent
          value="export"
          className="px-4 w-full overflow-hidden mt-0"
        >
          <ExportWallet address={address} />
        </TabsContent>
      )}
    </>
  );
};
