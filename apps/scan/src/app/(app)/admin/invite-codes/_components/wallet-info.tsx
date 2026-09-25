"use client";

import { AlertTriangle, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/trpc/client";
import { CHAIN_LABELS } from "@/types/chain";

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
      <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <div>
          <p className="font-medium text-destructive">Wallet Not Configured</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.error ??
              "The invite wallet is not configured. Set the INVITE_WALLET_NAME environment variable."}
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
          <code className="flex items-center gap-2 rounded bg-muted p-2 text-sm">
            <span className="flex-1 break-all">{data.address}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyAddress}
              className="h-6 w-6 shrink-0"
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
          <p className="mt-1 text-sm text-muted-foreground">
            Available for invite code redemptions
          </p>
        </CardContent>
      </Card>
      <Card className={lowEth ? "border-destructive/50" : undefined}>
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
          <p className="mt-1 text-sm text-muted-foreground">
            {lowEth
              ? "Low balance - fund wallet for gas fees"
              : "Available for gas fees"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
