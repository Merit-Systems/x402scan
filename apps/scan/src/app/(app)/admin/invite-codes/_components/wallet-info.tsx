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
      setTimeout(() => {
        setCopied(false);
      }, 2000);
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
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div>
          <p className="type-supporting-body type-emphasis text-destructive">
            Wallet Not Configured
          </p>
          <p className="type-supporting-body mt-1 text-muted-foreground">
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
          <code className="type-mono type-scale-supporting flex items-center gap-2 rounded bg-muted p-2">
            <span className="flex-1 break-all">{data.address}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyAddress}
              className="size-6 shrink-0"
            >
              {copied ? (
                <Check className="size-3" />
              ) : (
                <Copy className="size-3" />
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
          <p className="type-banner-metric">
            {formatCurrency(data.usdcBalance ?? 0)}
          </p>
          <p className="type-supporting-body mt-1 text-muted-foreground">
            Available for invite code redemptions
          </p>
        </CardContent>
      </Card>
      <Card className={lowEth ? "" : undefined}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ETH Balance
            {lowEth && <AlertTriangle className="size-4 text-destructive" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="type-banner-metric">
            {(data.ethBalance ?? 0).toFixed(6)} ETH
          </p>
          <p className="type-supporting-body mt-1 text-muted-foreground">
            {lowEth
              ? "Low balance - fund wallet for gas fees"
              : "Available for gas fees"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
