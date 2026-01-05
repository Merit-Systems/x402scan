import { cn } from '@/lib/utils';

import { ArrowDown, ArrowUp, type LucideIcon } from 'lucide-react';

import type { SortingContext } from '@/app/_contexts/sorting/base/context';
import { useSorting } from '@/app/_contexts/sorting/base/hook';

type BaseProps = {
  Icon: LucideIcon;
  label: string;
  className?: string;
};

type Props<SortKey extends string> = {
  sorting?: SortingProps<SortKey>;
} & BaseProps;

export const HeaderCell = <SortKey extends string>({
  Icon,
  label,
  className,
  sorting: sortingProps,
}: Props<SortKey>) => {
  if (sortingProps) {
    return (
      <SortableHeaderCell
        Icon={Icon}
        label={label}
        className={className}
        sortContext={sortingProps.sortContext}
        sortKey={sortingProps.sortKey}
      />
    );
  }
  return <HeaderCellInternal Icon={Icon} label={label} className={className} />;
};

type SortingProps<SortKey extends string> = {
  sortContext: SortingContext<SortKey>;
  sortKey: SortKey;
};

const SortableHeaderCell = <SortKey extends string>({
  Icon,
  label,
  className,
  sortContext,
  sortKey,
}: BaseProps & SortingProps<SortKey>) => {
  const sorting = useSorting(sortContext);

  const isSortable = sortKey && sorting;
  const isSorted = isSortable && sorting.sorting.id === sortKey;

  return (
    <HeaderCellInternal
      Icon={Icon}
      label={label}
      className={cn(
        className,
        'cursor-pointer hover:bg-accent rounded-md transition-all'
      )}
      onClick={() => {
        if (isSortable) {
          sorting.setSorting({
            id: sortKey,
            desc: sorting.sorting.id === sortKey ? !sorting.sorting.desc : true,
          });
        }
      }}
    >
      {isSorted ? (
        sorting.sorting.desc ? (
          <ArrowDown className="size-3" />
        ) : (
          <ArrowUp className="size-3" />
        )
      ) : null}
    </HeaderCellInternal>
  );
};

type HeaderCellInternalProps = {
  onClick?: () => void;
  children?: React.ReactNode;
} & BaseProps;

const HeaderCellInternal: React.FC<HeaderCellInternalProps> = ({
  Icon,
  label,
  className,
  onClick,
  children,
}: HeaderCellInternalProps) => {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-1 text-sm text-muted-foreground w-fit',
        className
      )}
      onClick={onClick}
    >
      <Icon className="size-3" />
      {label}
      {children}
    </div>
  );
};
