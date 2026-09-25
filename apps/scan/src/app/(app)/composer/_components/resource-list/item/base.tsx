import { Activity } from "lucide-react";

import { CommandItem as BaseCommandItem } from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";

import { Chains, Chain } from "@/app/(app)/_components/chains";
import { Favicon } from "@/app/(app)/_components/favicon";

import { cn, formatCurrency } from "@/lib/utils";

import type { RouterOutputs } from "@/trpc/client";
import type { SelectedResource } from "../../../_types/chat-config";

interface Props {
  isSelected: boolean;
  resource: RouterOutputs["public"]["tools"]["search"][number];
  onSelectResource: (resource: SelectedResource) => void;
}

export const BaseResourceItem: React.FC<Props> = ({
  resource,
  isSelected,
  onSelectResource,
}) => {
  return (
    <BaseCommandItem
      onSelect={() => {
        onSelectResource({ id: resource.id, favicon: resource.favicon });
      }}
      className="flex items-center justify-between gap-3"
      value={resource.resource}
    >
      <div className="flex flex-1 items-center gap-2 overflow-hidden">
        <div
          className={cn("rounded-md overflow-hidden relative shrink-0 size-6")}
        >
          <Favicon url={resource.favicon} className="size-full" />
        </div>

        <div className="flex flex-1 flex-col items-start gap-0 overflow-hidden">
          <h3
            className={cn(
              "type-card-title line-clamp-1 w-full max-w-full truncate",
              isSelected && "text-primary"
            )}
          >
            {resource.resource}
          </h3>
          <p className="line-clamp-2 type-caption text-muted-foreground">
            {resource.description}
          </p>
        </div>
      </div>
      {resource.invocations > 0 && (
        <div className="type-emphasis flex items-center gap-0.5 type-label">
          <Activity className="size-3 text-muted-foreground" />
          <p className="type-caption text-muted-foreground">
            {resource.invocations.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 1,
              notation: "compact",
            })}
          </p>
        </div>
      )}
      <ToolAccepts accepts={resource.accepts} />
    </BaseCommandItem>
  );
};

export const LoadingBaseResourceItem: React.FC = () => {
  return (
    <BaseCommandItem className="flex items-center justify-between gap-3">
      <div className="flex flex-1 items-center gap-2 overflow-hidden">
        <div
          className={cn("rounded-md overflow-hidden relative shrink-0 size-6")}
        >
          <Skeleton className="size-6" />
        </div>

        <div className="flex flex-1 flex-col items-start gap-0 overflow-hidden">
          <Skeleton className="my-0.5 h-[14px] w-24" />
          <Skeleton className="h-[10px] w-full" />
        </div>
      </div>
      <div className="type-emphasis flex items-center gap-0.5 type-label">
        <Activity className="size-3 text-muted-foreground" />
        <Skeleton className="h-[12px] w-4" />
      </div>
      <Skeleton className="h-[14px] w-8" />
    </BaseCommandItem>
  );
};

const ToolAmount = ({ amount }: { amount: number }) => {
  return (
    <span className="type-mono type-emphasis type-scale-caption text-primary">
      {formatCurrency(amount)}
    </span>
  );
};

const ToolAccepts = ({
  accepts,
}: {
  accepts: RouterOutputs["public"]["tools"]["search"][number]["accepts"];
}) => {
  const firstAccept = accepts.at(0);
  if (!firstAccept) return null;

  const allSameAmount = accepts.every(
    (accept) => accept.maxAmountRequired === firstAccept.maxAmountRequired
  );

  if (allSameAmount) {
    return (
      <div className="flex shrink-0 items-center gap-2">
        <ToolAmount amount={firstAccept.maxAmountRequired} />
        <Chains
          chains={accepts.map((accept) => accept.chain).sort()}
          iconClassName="size-3"
          className="gap-0.5"
        />
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      {accepts.map((accept) => (
        <div key={accept.chain} className="flex shrink-0 items-center gap-0.5">
          <ToolAmount amount={accept.maxAmountRequired} />
          <Chain chain={accept.chain} iconClassName="size-3" />
        </div>
      ))}
    </div>
  );
};
