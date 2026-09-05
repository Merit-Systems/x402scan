"use client";

import { User, Calendar, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Copyable } from "@/components/ui/copyable";
import { format } from "date-fns";

import type { DataTableColumnDef } from "@/components/ui/data-table";
import type { RouterOutputs } from "@/trpc/client";

type EndUser = RouterOutputs["admin"]["endUsers"]["list"][number];

const AuthMethodBadge = ({
  method,
}: {
  method: EndUser["authenticationMethods"][number];
}) => {
  if (method.type === "email") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 type-caption text-primary">
        Email: {method.email}
      </span>
    );
  }
  if (method.type === "sms") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-success-subtle px-2 py-0.5 type-caption text-success">
        SMS: {method.phoneNumber}
      </span>
    );
  }
  if (method.type === "jwt") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-0.5 type-caption text-accent-foreground">
        JWT
      </span>
    );
  }
  return null;
};

export const columns: DataTableColumnDef<EndUser>[] = [
  {
    accessorKey: "userId",
    header: () => (
      <div className="flex items-center gap-2">
        <User className="size-4" />
        <span className="type-emphasis type-caption">User ID</span>
      </div>
    ),
    cell: ({ row }) => (
      <Copyable
        value={row.original.userId}
        toastMessage="User ID copied"
        className="block max-w-[200px] truncate"
      >
        {row.original.userId}
      </Copyable>
    ),
    size: 250,
    meta: { loadingCell: <Skeleton className="h-4 w-full" /> },
  },
  {
    accessorKey: "authenticationMethods",
    header: () => (
      <div className="flex items-center gap-2">
        <span className="type-emphasis type-caption">Authentication</span>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.authenticationMethods.map((method, idx) => (
          <AuthMethodBadge key={idx} method={method} />
        ))}
      </div>
    ),
    size: 300,
    meta: { loadingCell: <Skeleton className="h-4 w-full" /> },
  },
  {
    accessorKey: "evmAccounts",
    header: () => (
      <div className="flex items-center gap-2">
        <Wallet className="size-4" />
        <span className="type-emphasis type-caption">EVM Accounts</span>
      </div>
    ),
    cell: ({ row }) => {
      if (row.original.evmAccounts.length === 0) {
        return <span className="type-caption text-muted-foreground">None</span>;
      }
      return (
        <div className="flex flex-col gap-1">
          {row.original.evmAccounts.map((account, idx) => (
            <Copyable
              key={idx}
              value={account}
              toastMessage="Address copied"
              className="block max-w-[150px] truncate"
            >
              {account}
            </Copyable>
          ))}
        </div>
      );
    },
    size: 200,
    meta: { loadingCell: <Skeleton className="h-4 w-full" /> },
  },
  {
    accessorKey: "evmSmartAccounts",
    header: () => (
      <div className="flex items-center gap-2">
        <Wallet className="size-4" />
        <span className="type-emphasis type-caption">Smart Accounts</span>
      </div>
    ),
    cell: ({ row }) => {
      if (row.original.evmSmartAccounts.length === 0) {
        return <span className="type-caption text-muted-foreground">None</span>;
      }
      return (
        <div className="flex flex-col gap-1">
          {row.original.evmSmartAccounts.map((account, idx) => (
            <Copyable
              key={idx}
              value={account}
              toastMessage="Address copied"
              className="block max-w-[150px] truncate"
            >
              {account}
            </Copyable>
          ))}
        </div>
      );
    },
    size: 200,
    meta: { loadingCell: <Skeleton className="h-4 w-full" /> },
  },
  {
    accessorKey: "solanaAccounts",
    header: () => (
      <div className="flex items-center gap-2">
        <Wallet className="size-4" />
        <span className="type-emphasis type-caption">Solana Accounts</span>
      </div>
    ),
    cell: ({ row }) => {
      if (row.original.solanaAccounts.length === 0) {
        return <span className="type-caption text-muted-foreground">None</span>;
      }
      return (
        <div className="flex flex-col gap-1">
          {row.original.solanaAccounts.map((account, idx) => (
            <Copyable
              key={idx}
              value={account}
              toastMessage="Address copied"
              className="block max-w-[150px] truncate"
            >
              {account}
            </Copyable>
          ))}
        </div>
      );
    },
    size: 200,
    meta: { loadingCell: <Skeleton className="h-4 w-full" /> },
  },
  {
    accessorKey: "createdAt",
    header: () => (
      <div className="flex items-center gap-2">
        <Calendar className="size-4" />
        <span className="type-emphasis type-caption">Created At</span>
      </div>
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return (
        <span className="type-mono type-scale-caption">
          {format(date, "MMM d, yyyy HH:mm")}
        </span>
      );
    },
    size: 150,
    meta: { loadingCell: <Skeleton className="h-4 w-full" /> },
  },
];
