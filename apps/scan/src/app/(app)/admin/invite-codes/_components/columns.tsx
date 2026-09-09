"use client";

import {
  Calendar,
  DollarSign,
  Hash,
  MoreHorizontal,
  User,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HeaderCell } from "@/app/(app)/admin/_components/data-table-header-cell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompactAgo, formatCurrency } from "@/lib/utils";
import { formatUnits } from "viem";

import type { DataTableColumnDef } from "@/components/ui/data-table";
import type { RouterOutputs } from "@/trpc/client";

type ColumnType = RouterOutputs["admin"]["inviteCodes"]["list"][number];

interface ColumnHandlers {
  onDisable?: (id: string) => void;
  onReactivate?: (id: string) => void;
  onEditMaxRedemptions?: (id: string, currentMax: number) => void;
}

const getStatusVariant = (
  status: string
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "ACTIVE":
      return "default";
    case "EXHAUSTED":
      return "secondary";
    case "EXPIRED":
      return "outline";
    case "DISABLED":
      return "destructive";
    default:
      return "outline";
  }
};

const truncateAddress = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

export const createColumns = (
  handlers?: ColumnHandlers
): DataTableColumnDef<ColumnType>[] => [
  {
    accessorKey: "code",
    header: () => (
      <HeaderCell Icon={Hash} label="Code" className="justify-start" />
    ),
    cell: ({ row }) => {
      const { code, note } = row.original;
      const codeElement = (
        <code className="rounded bg-muted px-2 py-1 font-mono text-xs">
          {code}
        </code>
      );
      if (!note) return codeElement;
      return (
        <Tooltip>
          <TooltipTrigger render={codeElement} />
          <TooltipContent side="right" className="max-w-[300px]">
            <p className="text-xs">{note}</p>
          </TooltipContent>
        </Tooltip>
      );
    },
    size: 150,
    meta: { loadingCell: <Skeleton className="h-4 w-24" /> },
  },
  {
    accessorKey: "amount",
    header: () => (
      <HeaderCell Icon={DollarSign} label="Amount" className="mx-auto" />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {formatCurrency(parseFloat(formatUnits(row.original.amount, 6)))}
      </div>
    ),
    size: 100,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    accessorKey: "redemptions",
    header: () => (
      <HeaderCell Icon={Hash} label="Redemptions" className="mx-auto" />
    ),
    cell: ({ row }) => {
      const { redemptionCount, maxRedemptions } = row.original;
      const text =
        maxRedemptions === 0
          ? `${redemptionCount} / ∞`
          : `${redemptionCount} / ${maxRedemptions}`;
      return <div className="text-center font-mono text-xs">{text}</div>;
    },
    size: 120,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    accessorKey: "redeemedBy",
    header: () => (
      <HeaderCell Icon={Wallet} label="Redeemed By" className="justify-start" />
    ),
    cell: ({ row }) => {
      const { redemptions } = row.original;
      if (!redemptions || redemptions.length === 0) {
        return <div className="text-xs text-muted-foreground">-</div>;
      }
      const addresses = redemptions.map((r) => r.recipientAddr);
      const uniqueAddresses = [...new Set(addresses)];
      const firstAddress = uniqueAddresses[0];
      if (uniqueAddresses.length === 1 && firstAddress) {
        return (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto px-1 font-mono"
            title={firstAddress}
            aria-label={`Copy ${firstAddress}`}
            onClick={() => void navigator.clipboard.writeText(firstAddress)}
          >
            {truncateAddress(firstAddress)}
          </Button>
        );
      }
      return (
        <div className="space-y-0.5 text-xs">
          {uniqueAddresses.slice(0, 2).map((addr) => (
            <Button
              key={addr}
              type="button"
              variant="ghost"
              size="sm"
              className="block h-auto px-1 font-mono"
              title={addr}
              aria-label={`Copy ${addr}`}
              onClick={() => void navigator.clipboard.writeText(addr)}
            >
              {truncateAddress(addr)}
            </Button>
          ))}
          {uniqueAddresses.length > 2 && (
            <span className="text-muted-foreground">
              +{uniqueAddresses.length - 2} more
            </span>
          )}
        </div>
      );
    },
    size: 140,
    meta: { loadingCell: <Skeleton className="h-4 w-24" /> },
  },
  {
    accessorKey: "status",
    header: () => <HeaderCell Icon={Hash} label="Status" className="mx-auto" />,
    cell: ({ row }) => (
      <div className="text-center">
        <Badge variant={getStatusVariant(row.original.status)}>
          {row.original.status}
        </Badge>
      </div>
    ),
    size: 100,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    accessorKey: "uniqueRecipients",
    header: () => (
      <HeaderCell Icon={User} label="Unique Only" className="mx-auto" />
    ),
    cell: ({ row }) => (
      <div className="text-center text-xs">
        {row.original.uniqueRecipients ? "Yes" : "No"}
      </div>
    ),
    size: 100,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-12" /> },
  },
  {
    accessorKey: "createdBy",
    header: () => (
      <HeaderCell Icon={User} label="Created By" className="mx-auto" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[120px] truncate text-center text-xs text-muted-foreground">
        {row.original.createdBy.email ?? row.original.createdBy.name ?? "N/A"}
      </div>
    ),
    size: 120,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-20" /> },
  },
  {
    accessorKey: "expiresAt",
    header: () => (
      <HeaderCell Icon={Calendar} label="Expires" className="mx-auto" />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {row.original.expiresAt
          ? formatCompactAgo(row.original.expiresAt, { allowFuture: true })
          : "Never"}
      </div>
    ),
    size: 100,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    accessorKey: "createdAt",
    header: () => (
      <HeaderCell Icon={Calendar} label="Created" className="mx-auto" />
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono text-xs">
        {formatCompactAgo(row.original.createdAt)}
      </div>
    ),
    size: 100,
    meta: { loadingCell: <Skeleton className="mx-auto h-4 w-16" /> },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { status, id, maxRedemptions } = row.original;
      const canDisable = status === "ACTIVE";
      const canReactivate = status === "DISABLED" || status === "EXPIRED";

      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" className="h-8 w-8 p-0" />}
          >
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                handlers?.onEditMaxRedemptions?.(id, maxRedemptions)
              }
            >
              Edit Max Redemptions
            </DropdownMenuItem>
            {canDisable && (
              <DropdownMenuItem
                onClick={() => handlers?.onDisable?.(id)}
                className="text-destructive"
              >
                Disable
              </DropdownMenuItem>
            )}
            {canReactivate && (
              <DropdownMenuItem onClick={() => handlers?.onReactivate?.(id)}>
                Reactivate
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() =>
                void navigator.clipboard.writeText(row.original.code)
              }
            >
              Copy Code
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                void navigator.clipboard.writeText(
                  `https://agentcash.dev?invite=${encodeURIComponent(row.original.code)}`
                )
              }
            >
              Copy Full URL
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                void navigator.clipboard.writeText(
                  `https://poncho.merit.systems?inviteCode=${encodeURIComponent(row.original.code)}`
                )
              }
            >
              Copy Poncho Invite URL
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    size: 50,
  },
];
