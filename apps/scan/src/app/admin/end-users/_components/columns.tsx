'use client';

import { User, Calendar, Wallet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Copyable } from '@/components/ui/copyable';
import { format } from 'date-fns';

import type { ExtendedColumnDef } from '@/components/ui/data-table';
import type { RouterOutputs } from '@/trpc/client';

type EndUser = RouterOutputs['admin']['endUsers']['list'][number];

const AuthMethodBadge = ({ method }: { method: EndUser['authenticationMethods'][number] }) => {
  if (method.type === 'email') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 text-xs">
        Email: {method.email}
      </span>
    );
  }
  if (method.type === 'sms') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/10 text-green-600 text-xs">
        SMS: {method.phoneNumber}
      </span>
    );
  }
  if (method.type === 'jwt') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 text-xs">
        JWT
      </span>
    );
  }
  return null;
};

export const columns: ExtendedColumnDef<EndUser>[] = [
  {
    accessorKey: 'userId',
    header: () => (
      <div className="flex items-center gap-2">
        <User className="size-4" />
        <span className="text-xs font-medium">User ID</span>
      </div>
    ),
    cell: ({ row }) => (
      <Copyable
        value={row.original.userId}
        toastMessage="User ID copied"
        className="text-xs font-mono font-medium truncate max-w-[200px] block"
      >
        {row.original.userId}
      </Copyable>
    ),
    size: 250,
    loading: () => <Skeleton className="h-4 w-full" />,
  },
  {
    accessorKey: 'authenticationMethods',
    header: () => (
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium">Authentication</span>
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
    loading: () => <Skeleton className="h-4 w-full" />,
  },
  {
    accessorKey: 'evmAccounts',
    header: () => (
      <div className="flex items-center gap-2">
        <Wallet className="size-4" />
        <span className="text-xs font-medium">EVM Accounts</span>
      </div>
    ),
    cell: ({ row }) => {
      if (row.original.evmAccounts.length === 0) {
        return <span className="text-xs text-muted-foreground">None</span>;
      }
      return (
        <div className="flex flex-col gap-1">
          {row.original.evmAccounts.map((account, idx) => (
            <Copyable
              key={idx}
              value={account}
              toastMessage="Address copied"
              className="text-xs font-mono truncate max-w-[150px] block"
            >
              {account}
            </Copyable>
          ))}
        </div>
      );
    },
    size: 200,
    loading: () => <Skeleton className="h-4 w-full" />,
  },
  {
    accessorKey: 'evmSmartAccounts',
    header: () => (
      <div className="flex items-center gap-2">
        <Wallet className="size-4" />
        <span className="text-xs font-medium">Smart Accounts</span>
      </div>
    ),
    cell: ({ row }) => {
      if (row.original.evmSmartAccounts.length === 0) {
        return <span className="text-xs text-muted-foreground">None</span>;
      }
      return (
        <div className="flex flex-col gap-1">
          {row.original.evmSmartAccounts.map((account, idx) => (
            <Copyable
              key={idx}
              value={account}
              toastMessage="Address copied"
              className="text-xs font-mono truncate max-w-[150px] block"
            >
              {account}
            </Copyable>
          ))}
        </div>
      );
    },
    size: 200,
    loading: () => <Skeleton className="h-4 w-full" />,
  },
  {
    accessorKey: 'solanaAccounts',
    header: () => (
      <div className="flex items-center gap-2">
        <Wallet className="size-4" />
        <span className="text-xs font-medium">Solana Accounts</span>
      </div>
    ),
    cell: ({ row }) => {
      if (row.original.solanaAccounts.length === 0) {
        return <span className="text-xs text-muted-foreground">None</span>;
      }
      return (
        <div className="flex flex-col gap-1">
          {row.original.solanaAccounts.map((account, idx) => (
            <Copyable
              key={idx}
              value={account}
              toastMessage="Address copied"
              className="text-xs font-mono truncate max-w-[150px] block"
            >
              {account}
            </Copyable>
          ))}
        </div>
      );
    },
    size: 200,
    loading: () => <Skeleton className="h-4 w-full" />,
  },
  {
    accessorKey: 'createdAt',
    header: () => (
      <div className="flex items-center gap-2">
        <Calendar className="size-4" />
        <span className="text-xs font-medium">Created At</span>
      </div>
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return (
        <span className="text-xs font-mono">
          {format(date, 'MMM d, yyyy HH:mm')}
        </span>
      );
    },
    size: 150,
    loading: () => <Skeleton className="h-4 w-full" />,
  },
];

