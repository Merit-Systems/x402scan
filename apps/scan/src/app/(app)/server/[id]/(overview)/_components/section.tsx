import { cn } from '@/lib/utils';

interface Props {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export const OriginOverviewSection: React.FC<Props> = ({
  title,
  children,
  className,
  action,
}) => {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
};
