import { TabsContent } from '@/components/ui/tabs';

import { Deposit } from './tabs/deposit';
import { Withdraw } from './tabs/withdraw';
import { ExportWallet } from './tabs/export';
import { WalletContent } from './tabs/display';

import type { User } from '@coinbase/cdp-hooks';

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
        <Withdraw />
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
