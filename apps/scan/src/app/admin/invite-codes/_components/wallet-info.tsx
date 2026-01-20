'use client';

import { AlertTriangle, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { api } from '@/trpc/client';
import { CHAIN_LABELS } from '@/types/chain';

export const WalletInfo = () => {
  const { data, isLoading } = api.admin.inviteCodes.walletInfo.useQuery();
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (data?.address) {
      void navigator.clipboard.writeText(data.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
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
        <Card>
          <CardHeader>
            <CardTitle>ETH Balance</CardTitle>
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

  if (!data.configured) {
    return (
      <div className="flex items-start gap-3 p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-destructive">Wallet Not Configured</p>
          <p className="text-sm text-muted-foreground mt-1">
            {data.error ??
              'The invite wallet is not configured. Set the INVITE_WALLET_NAME environment variable.'}
          </p>
        </div>
      </div>
    );
  }

  const lowEth = (data.ethBalance ?? 0) < 0.001;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>{CHAIN_LABELS[data.chain]} Invite Wallet</CardTitle>
        </CardHeader>
        <CardContent>
          <code className="text-sm bg-muted p-2 rounded flex items-center gap-2">
            <span className="break-all flex-1">{data.address}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyAddress}
              className="shrink-0 h-6 w-6"
            >
              {copied ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </code>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>USDC Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            {formatCurrency(data.usdcBalance ?? 0)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Available for invite code redemptions
          </p>
        </CardContent>
      </Card>
      <Card className={lowEth ? 'border-destructive/50' : undefined}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ETH Balance
            {lowEth && <AlertTriangle className="h-4 w-4 text-destructive" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            {(data.ethBalance ?? 0).toFixed(6)} ETH
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {lowEth
              ? 'Low balance - fund wallet for gas fees'
              : 'Available for gas fees'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
