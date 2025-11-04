import React from 'react';

import { cn } from '@/lib/utils';

import type { LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  Icon: LucideIcon;
  value: number | string;
  className?: string;
}

export const FooterStat: React.FC<Props> = ({ Icon, value, className }) => {
  return (
    <FooterStatContainer Icon={Icon} className={className}>
      <p className="text-[10px] font-mono">
        {typeof value === 'number'
          ? value.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 1,
              notation: 'compact',
            })
          : value}
      </p>
    </FooterStatContainer>
  );
};

interface FooterStatContainerProps extends Omit<Props, 'value'> {
  children: React.ReactNode;
}

const FooterStatContainer: React.FC<FooterStatContainerProps> = ({
  Icon,
  className,
  children,
}) => {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Icon className="size-2.5 shrink-0" />
      {children}
    </div>
  );
};

export const LoadingFooterStat: React.FC<
  Omit<FooterStatContainerProps, 'children'>
> = ({ Icon, className }) => {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      <Icon className="size-3 shrink-0" />
      <Skeleton className="w-6 h-[12px] md:h-[14px]" />
    </div>
  );
};
