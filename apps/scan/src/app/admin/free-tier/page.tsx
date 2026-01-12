import { Body, Heading } from '@/app/_components/layout/page-utils';
import { auth } from '@/auth';
import { forbidden } from 'next/navigation';
import { freeTierWallets } from '@/services/cdp/server-wallet/free-tier';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHAIN_LABELS, SUPPORTED_CHAINS } from '@/types/chain';
import { usdc } from '@/lib/tokens/usdc';

import type { SupportedChain } from '@/types/chain';

export default async function FreeTierWalletPage() {
  const session = await auth();

  if (session?.user.role !== 'admin') {
    forbidden();
  }

  return (
    <div>
      <Heading
        title="Free Tier Wallet Monitor"
        description="Monitor the balance of the free tier wallet used for subsidizing user transactions."
      />
      <Body>
        {SUPPORTED_CHAINS.map(chain => (
          <ChainWalletInformation chain={chain} key={chain} />
        ))}
      </Body>
    </div>
  );
}

const ChainWalletInformation = async ({ chain }: { chain: SupportedChain }) => {
  const wallet = freeTierWallets[chain];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{CHAIN_LABELS[chain]} Wallet Address</CardTitle>
        </CardHeader>
        <CardContent>
          <code className="text-sm bg-muted p-2 rounded block break-all">
            {await wallet.address()}
          </code>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>USDC Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-3xl font-bold">
              {formatCurrency(
                await wallet.getTokenBalance({ token: usdc(chain) })
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
