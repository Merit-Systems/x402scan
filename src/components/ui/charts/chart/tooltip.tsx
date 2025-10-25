import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

import { Card } from '../../card';

import type { ChartData, TooltipRowProps } from './types';

interface Props<T extends Record<string, number>> {
  data: ChartData<T>;
  rows: Array<TooltipRowProps<T>>;
}

export const TooltipContent = <T extends Record<string, number>>({
  data,
  rows,
}: Props<T>) => {
  return (
    <Card className="min-w-32 overflow-hidden">
      <TooltipDate date={new Date(data.timestamp)} />
      <Separator />
      <div className="py-2">
        {rows
          .filter(row => row.key in data)
          .map(row => (
            <TooltipRow
              {...row}
              key={row.key as string}
              value={row.getValue(data[row.key], data)}
            />
          ))}
      </div>
    </Card>
  );
};

const TooltipRow = <T extends Record<string, number>, K extends keyof T>({
  label,
  value,
  labelClassName,
  valueClassName,
  dotColor,
}: TooltipRowProps<T, K> & {
  value: string;
}) => {
  return (
    <div className="flex justify-between w-full gap-4 px-2">
      <div className="flex items-center gap-2">
        {dotColor && (
          <div
            className="size-2 rounded-full"
            style={{ backgroundColor: dotColor }}
          />
        )}
        <p className={cn('text-xs text-muted-foreground', labelClassName)}>
          {label}
        </p>
      </div>
      <p
        className={cn(
          'text-xs text-muted-foreground font-medium',
          valueClassName
        )}
      >
        {value}
      </p>
    </div>
  );
};

const TooltipDate = ({ date }: { date: Date }) => {
  return (
    <div className="flex justify-between items-center w-full gap-4 bg-muted p-2">
      <p className="font-medium text-xs">{format(date, 'MMM d, yyyy')}</p>
    </div>
  );
};
