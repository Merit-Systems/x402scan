import { TabsContent } from "@/components/ui/tabs";

import { Deposit } from "./tabs/deposit";
import { Withdraw } from "./tabs/withdraw";
import { ExportWallet } from "./tabs/export";
import { WalletContent } from "./tabs/display";

import type { User } from "@coinbase/cdp-hooks";

interface Props {
  user?: User;
  address: string;
}

export const ConnectedWalletTabsContent = ({ user, address }: Props) => {
  return (
    <>
      <TabsContent value="wallet" className="mt-0 w-full overflow-hidden">
        <WalletContent user={user} address={address} />
      </TabsContent>
      <TabsContent value="deposit" className="mt-0 w-full overflow-hidden">
        <Deposit address={address} />
      </TabsContent>
      <TabsContent value="withdraw" className="mt-0 w-full overflow-hidden">
        <Withdraw />
      </TabsContent>
      {user && (
        <TabsContent value="export" className="mt-0 w-full overflow-hidden">
          <ExportWallet address={address} />
        </TabsContent>
      )}
    </>
  );
};
