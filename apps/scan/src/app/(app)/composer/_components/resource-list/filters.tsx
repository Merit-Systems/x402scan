import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Props<T> {
  title: string;
  items: T[];
  isLoading: boolean;
  onClickItem: (item: T) => void;
  isSelected: (item: T) => boolean;
  itemKey: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
}

export const Filters = <T,>({
  title,
  items,
  isLoading,
  onClickItem,
  isSelected,
  itemKey,
  renderItem,
}: Props<T>) => {
  return (
    <div className="my-2">
      <div className="type-emphasis mb-1.5 px-2 type-caption text-muted-foreground">
        {title}
      </div>
      <div className="no-scrollbar flex gap-1 overflow-x-auto px-2">
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-[22px] w-12" />
            ))
          : items.map((item) => (
              <Badge
                key={itemKey(item)}
                variant={isSelected(item) ? "default" : "outline"}
                className="shrink-0 cursor-pointer gap-1"
                onClick={() => {
                  onClickItem(item);
                }}
              >
                {renderItem(item)}
              </Badge>
            ))}
      </div>
    </div>
  );
};
