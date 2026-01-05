import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

type Props<T> = {
  title: string;
  items: T[];
  isLoading: boolean;
  onClickItem: (item: T) => void;
  isSelected: (item: T) => boolean;
  itemKey: (item: T) => string;
  itemComponent: (item: T) => React.ReactNode;
};

export const Filters = <T,>({
  title,
  items,
  isLoading,
  onClickItem,
  isSelected,
  itemKey,
  itemComponent,
}: Props<T>) => {
  return (
    <div className="my-2">
      <div className="text-muted-foreground mb-1.5 px-2 text-xs font-medium">
        {title}
      </div>
      <div className="no-scrollbar flex gap-1 overflow-x-auto px-2">
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="w-12 h-[22px]" />
            ))
          : items?.map(item => (
              <Badge
                key={itemKey(item)}
                variant={isSelected(item) ? 'default' : 'outline'}
                className="shrink-0 cursor-pointer gap-1 px-1.5 py-0.5"
                onClick={() => onClickItem(item)}
              >
                {itemComponent(item)}
              </Badge>
            ))}
      </div>
    </div>
  );
};
