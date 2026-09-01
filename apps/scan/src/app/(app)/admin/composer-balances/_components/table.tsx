"use client";

import { Download, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LoadableDataTable } from "@/app/(app)/admin/_components/loadable-data-table";

import { api } from "@/trpc/client";
import { formatCurrency } from "@/lib/utils";
import { CHAIN_LABELS } from "@/types/chain";

import { columns } from "./columns";

import type { RouterOutputs } from "@/trpc/client";

type Report = RouterOutputs["admin"]["composerBalances"]["report"];

const CSV_HEADERS = [
  "usdc",
  "chain",
  "walletType",
  "email",
  "loginAddresses",
  "composerWalletAddress",
  "walletName",
  "userId",
] as const;

const toCsv = (rows: Report["rows"]): string => {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;

  return [
    CSV_HEADERS.join(","),
    ...rows.map((row) =>
      [
        row.usdc.toString(),
        CHAIN_LABELS[row.chain],
        row.source,
        row.email ?? "",
        row.loginAddresses.join("; "),
        row.address,
        row.walletName,
        row.userId ?? "",
      ]
        .map(escape)
        .join(",")
    ),
  ].join("\n");
};

const downloadCsv = (csv: string) => {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `composer-balances-${new Date().toISOString().replace(/[:.]/g, "-")}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const Stat: React.FC<{ label: string; value: string; hint?: string }> = ({
  label,
  value,
  hint,
}) => (
  <div className="flex flex-col gap-1 rounded-md border p-4">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-2xl font-medium tabular-nums">{value}</span>
    {hint ? (
      <span className="text-xs text-muted-foreground">{hint}</span>
    ) : null}
  </div>
);

export const ComposerBalancesTable = () => {
  const { data, isLoading, isFetching, refetch } =
    api.admin.composerBalances.report.useQuery(undefined, {
      refetchOnWindowFocus: false,
    });

  const totals = data?.totals;
  const bySource = data?.bySource;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat
          label="People with a balance"
          value={totals ? totals.peopleCount.toLocaleString() : "—"}
          hint={
            totals
              ? `${totals.walletCount} wallets · ${totals.userCount} CDP identities`
              : undefined
          }
        />
        <Stat
          label="Total outstanding"
          value={totals ? formatCurrency(totals.totalUsdc) : "—"}
          hint="USDC on Base + Solana"
        />
        <Stat
          label="Reachable by email"
          value={totals ? totals.withEmail.toLocaleString() : "—"}
          hint={
            totals
              ? `${totals.withLoginAddress} have a login address`
              : undefined
          }
        />
        <Stat
          label="Orphaned wallets"
          value={totals ? totals.orphaned.toLocaleString() : "—"}
          hint="No ServerWallet row — user deleted"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Stat
          label="Server wallets"
          value={bySource ? formatCurrency(bySource.server.totalUsdc) : "—"}
          hint={
            bySource
              ? `${bySource.server.walletCount} wallets · ${bySource.server.userCount} users · we can sweep these`
              : undefined
          }
        />
        <Stat
          label="Embedded wallets"
          value={bySource ? formatCurrency(bySource.embedded.totalUsdc) : "—"}
          hint={
            bySource
              ? `${bySource.embedded.walletCount} wallets · ${bySource.embedded.userCount} users · non-custodial, user must withdraw`
              : undefined
          }
        />
      </div>

      {data && data.systemWallets.length > 0 ? (
        <div className="space-y-2 rounded-md border p-4">
          <div className="text-xs font-medium text-muted-foreground">
            App wallets (not user funds)
          </div>
          <div className="flex flex-wrap gap-4">
            {data.systemWallets.map((wallet) => (
              <div
                key={`${wallet.name}-${wallet.chain}`}
                className="font-mono text-xs"
              >
                <span className="text-muted-foreground">
                  {wallet.name} · {CHAIN_LABELS[wallet.chain]}
                </span>{" "}
                <span className="font-medium">
                  {formatCurrency(wallet.usdc)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {data
            ? `${data.rows.length} wallets holding a balance`
            : "Scanning wallets…"}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => void refetch()}
            disabled={isFetching}
            variant="outline"
            size="sm"
          >
            <RefreshCw
              className={`mr-2 size-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            onClick={() => data && downloadCsv(toCsv(data.rows))}
            disabled={!data || data.rows.length === 0}
            variant="outline"
            size="sm"
          >
            <Download className="mr-2 size-4" />
            Download CSV
          </Button>
        </div>
      </div>

      <LoadableDataTable
        columns={columns}
        data={data?.rows ?? []}
        isLoading={isLoading}
        getRowId={(row, index) =>
          row ? `${row.walletName}-${row.chain}` : `loading-${index}`
        }
      />
    </div>
  );
};
