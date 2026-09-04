"use client";

import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";

import type { SortingContext } from "@/app/(app)/admin/_contexts/sorting/base/context";
import { useSorting } from "@/app/(app)/admin/_contexts/sorting/base/hook";
import { cn } from "@/lib/utils";

interface BaseProps {
  Icon: LucideIcon;
  label: string;
  className?: string;
}

type Props<SortKey extends string> = {
  sorting?: SortingProps<SortKey>;
} & BaseProps;

interface SortingProps<SortKey extends string> {
  sortContext: SortingContext<SortKey>;
  sortKey: SortKey;
}

export function HeaderCell<SortKey extends string>({
  Icon,
  label,
  className,
  sorting,
}: Props<SortKey>) {
  if (sorting) {
    return (
      <SortableHeaderCell
        Icon={Icon}
        label={label}
        className={className}
        sortContext={sorting.sortContext}
        sortKey={sorting.sortKey}
      />
    );
  }

  return <HeaderCellContent Icon={Icon} label={label} className={className} />;
}

function SortableHeaderCell<SortKey extends string>({
  Icon,
  label,
  className,
  sortContext,
  sortKey,
}: BaseProps & SortingProps<SortKey>) {
  const sorting = useSorting(sortContext);

  if (!sorting) {
    return (
      <HeaderCellContent Icon={Icon} label={label} className={className} />
    );
  }

  const isSorted = sorting.sorting.id === sortKey;

  return (
    <HeaderCellContent
      Icon={Icon}
      label={label}
      className={cn(className, "cursor-pointer rounded-md hover:bg-accent")}
      onClick={() => {
        sorting.setSorting({
          id: sortKey,
          desc: sorting.sorting.id === sortKey ? !sorting.sorting.desc : true,
        });
      }}
    >
      {isSorted ? (
        sorting.sorting.desc ? (
          <ArrowDown className="size-3" />
        ) : (
          <ArrowUp className="size-3" />
        )
      ) : null}
    </HeaderCellContent>
  );
}

type HeaderCellContentProps = BaseProps & {
  children?: React.ReactNode;
  onClick?: () => void;
};

function HeaderCellContent({
  Icon,
  label,
  className,
  children,
  onClick,
}: HeaderCellContentProps) {
  return (
    <div
      className={cn(
        "flex w-fit items-center justify-center gap-1 text-sm text-muted-foreground",
        className
      )}
      onClick={onClick}
    >
      <Icon className="size-3" />
      {label}
      {children}
    </div>
  );
}
