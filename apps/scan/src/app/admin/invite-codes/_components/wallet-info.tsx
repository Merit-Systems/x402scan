'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { api } from '@/trpc/client';
import { CHAIN_LABELS } from '@/types/chain';

export const WalletInfo = () => {
  const { data, isLoading } = api.admin.inviteCodes.walletInfo.useQuery();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invite Wallet Address</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-6 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>USDC Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{CHAIN_LABELS[data.chain]} Invite Wallet</CardTitle>
        </CardHeader>
        <CardContent>
          <code className="text-sm bg-muted p-2 rounded block break-all">
            {data.address}
          </code>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>USDC Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{formatCurrency(data.balance)}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Available for invite code redemptions
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
