import { Body, Heading } from '@/app/_components/layout/page-utils';
import { auth } from '@/auth';
import { forbidden } from 'next/navigation';
import { getFreeTierWalletBalances } from '@/services/cdp/server-wallet/free-tier';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function FreeTierWalletPage() {
  const session = await auth();

  if (session?.user.role !== 'admin') {
    return forbidden();
  }

  const balances = await getFreeTierWalletBalances();

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
              <code className="text-sm bg-muted p-2 rounded block break-all">
                {balances.address}
              </code>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>ETH Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-3xl font-bold">
                    {balances.eth.toFixed(6)} ETH
                  </p>
                  <p className="text-sm text-muted-foreground">Network: Base</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>USDC Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-3xl font-bold">
                    {formatCurrency(balances.usdc)}
                  </p>
                  <p className="text-sm text-muted-foreground">Network: Base</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {balances.usdc < 10 ? (
                  <p className="text-yellow-600 dark:text-yellow-400 font-medium">
                    ⚠️ Low USDC balance - Consider topping up for user subsidies
                  </p>
                ) : (
                  <p className="text-green-600 dark:text-green-400 font-medium">
                    ✓ Wallet balances are healthy
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </Body>
    </div>
  );
}
