"use client";

import { Mail, Wallet, Coins, KeyRound } from "lucide-react";

import { Copyable } from "@/components/ui/copyable";
import { Skeleton } from "@/components/ui/skeleton";

import { CHAIN_LABELS } from "@/types/chain";
import { formatCurrency } from "@/lib/utils";

import type { DataTableColumnDef } from "@/components/ui/data-table";
import type { RouterOutputs } from "@/trpc/client";

type BalanceRow =
  RouterOutputs["admin"]["composerBalances"]["report"]["rows"][number];

const truncateAddress = (address: string) =>
  `${address.slice(0, 6)}…${address.slice(-4)}`;

export const columns: DataTableColumnDef<BalanceRow>[] = [
  {
    accessorKey: "usdc",
    header: () => (
      <div className="flex items-center gap-2">
        <Coins className="size-4" />
        <span className="type-emphasis type-caption">Balance</span>
      </div>
    ),
    cell: ({ row }) => (
      <span className="type-mono type-emphasis type-scale-caption tabular-nums">
        {formatCurrency(row.original.usdc)}
      </span>
    ),
    size: 110,
    meta: { loadingCell: <Skeleton className="h-4 w-full" /> },
  },
  {
    accessorKey: "chain",
    header: () => <span className="type-emphasis type-caption">Chain</span>,
    cell: ({ row }) => (
      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 type-caption text-primary">
        {CHAIN_LABELS[row.original.chain]}
      </span>
    ),
    size: 100,
    meta: { loadingCell: <Skeleton className="h-4 w-full" /> },
  },
  {
    accessorKey: "source",
    header: () => (
      <span className="type-emphasis type-caption">Wallet Type</span>
    ),
    cell: ({ row }) =>
      row.original.source === "server" ? (
        <span
          className="inline-flex items-center rounded-md bg-information-subtle px-2 py-0.5 type-caption text-information"
          title="CDP server wallet — we hold the keys and can sweep it"
        >
          Server
        </span>
      ) : (
        <span
          className="inline-flex items-center rounded-md bg-accent px-2 py-0.5 type-caption text-accent-foreground"
          title="CDP embedded wallet — non-custodial, only the user can withdraw"
        >
          Embedded
        </span>
      ),
    size: 120,
    meta: { loadingCell: <Skeleton className="h-4 w-full" /> },
  },
  {
    accessorKey: "email",
    header: () => (
      <div className="flex items-center gap-2">
        <Mail className="size-4" />
        <span className="type-emphasis type-caption">Email</span>
      </div>
    ),
    cell: ({ row }) => {
      const { email } = row.original;
      if (!email) {
        return <span className="type-caption text-muted-foreground">—</span>;
      }
      return (
        <Copyable
          value={email}
          toastMessage="Email copied"
          className="block max-w-[220px] truncate"
        >
          {email}
        </Copyable>
      );
    },
    size: 240,
    meta: { loadingCell: <Skeleton className="h-4 w-full" /> },
  },
  {
    accessorKey: "loginAddresses",
    header: () => (
      <div className="flex items-center gap-2">
        <KeyRound className="size-4" />
        <span className="type-emphasis type-caption">Signed in with</span>
      </div>
    ),
    cell: ({ row }) => {
      const { loginAddresses } = row.original;
      if (loginAddresses.length === 0) {
        return <span className="type-caption text-muted-foreground">—</span>;
      }
      return (
        <div className="flex flex-col gap-1">
          {loginAddresses.map((loginAddress) => (
            <Copyable
              key={loginAddress}
              value={loginAddress}
              toastMessage="Address copied"
              className="block"
            >
              {truncateAddress(loginAddress)}
            </Copyable>
          ))}
        </div>
      );
    },
    size: 180,
    meta: { loadingCell: <Skeleton className="h-4 w-full" /> },
  },
  {
    accessorKey: "address",
    header: () => (
      <div className="flex items-center gap-2">
        <Wallet className="size-4" />
        <span className="type-emphasis type-caption">Composer Wallet</span>
      </div>
    ),
    cell: ({ row }) => (
      <Copyable
        value={row.original.address}
        toastMessage="Address copied"
        className="block"
      >
        {truncateAddress(row.original.address)}
      </Copyable>
    ),
    size: 180,
    meta: { loadingCell: <Skeleton className="h-4 w-full" /> },
  },
  {
    accessorKey: "userId",
    header: () => <span className="type-emphasis type-caption">User</span>,
    cell: ({ row }) => {
      const { userId } = row.original;
      if (!userId) {
        return (
          <span className="inline-flex items-center rounded-md bg-warning-subtle px-2 py-0.5 type-caption text-warning">
            Orphaned
          </span>
        );
      }
      return (
        <Copyable
          value={userId}
          toastMessage="User ID copied"
          className="block max-w-[160px] truncate"
        >
          {userId}
        </Copyable>
      );
    },
    size: 180,
    meta: { loadingCell: <Skeleton className="h-4 w-full" /> },
  },
];
