'use client';

import { Copy, Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatCompactAgo } from '@/lib/utils';
import { api } from '@/trpc/client';

interface WalletDetailsProps {
  wallet: string;
}

export const WalletDetails = ({ wallet }: WalletDetailsProps) => {
  const { data, isLoading } = api.admin.users.getByWallet.useQuery({ wallet });
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    void navigator.clipboard.writeText(wallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Address</CardTitle>
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
              <CardTitle>First Seen</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!data || !data.valid) {
    return (
      <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
        <p className="font-medium text-destructive">Invalid Wallet</p>
        <p className="text-sm text-muted-foreground mt-1">
          {data?.error ?? 'Could not load wallet data.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Wallet Address</CardTitle>
          </CardHeader>
          <CardContent>
            <code className="text-sm bg-muted p-2 rounded flex items-center gap-2">
              <span className="break-all flex-1 font-mono">{wallet}</span>
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
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-6 w-6"
                asChild
              >
                <a
                  href={`https://basescan.org/address/${wallet}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
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
            <p className="text-sm text-muted-foreground mt-1">On Base</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>First Seen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {data.firstSeen ? formatCompactAgo(data.firstSeen) : '—'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {data.firstSeen
                ? new Date(data.firstSeen).toLocaleDateString()
                : 'No redemptions yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invite Redemptions</CardTitle>
        </CardHeader>
        <CardContent>
          {!data.redemptions || data.redemptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No invite codes redeemed yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Redeemed</TableHead>
                  <TableHead>Transaction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.redemptions?.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                        {r.code}
                      </code>
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatCurrency(r.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.createdBy ?? 'N/A'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatCompactAgo(r.redeemedAt)}
                    </TableCell>
                    <TableCell>
                      {r.txHash ? (
                        <a
                          href={`https://basescan.org/tx/${r.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-xs font-mono"
                        >
                          {r.txHash.slice(0, 10)}...
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
