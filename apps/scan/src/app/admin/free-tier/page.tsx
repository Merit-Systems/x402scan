import { Body, Heading } from '@/app/_components/layout/page-utils';
import { auth } from '@/auth';
import { forbidden } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copyable } from '@/components/ui/copyable';
import { getWalletAddressFromName } from '@/services/cdp/server-wallet/admin';
import { env } from '@/env';

export default async function FreeTierWalletPage() {
  const session = await auth();

  if (session?.user.role !== 'admin') {
    return forbidden();
  }

  const address = await getWalletAddressFromName(env.FREE_TIER_WALLET_NAME!);

  return (
    <div>
      <Heading
        title="Free Tier Wallet Monitor"
        description="Monitor the balance of the free tier wallet used for subsidizing user transactions."
      />
      <Body>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Address</CardTitle>
            </CardHeader>
            <CardContent>
              <Copyable
                value={address}
                toastMessage="Wallet address copied"
                className="text-sm bg-muted p-2 rounded block break-all font-mono"
              >
                {address}
              </Copyable>
            </CardContent>
          </Card>
        </div>
      </Body>
    </div>
  );
}
