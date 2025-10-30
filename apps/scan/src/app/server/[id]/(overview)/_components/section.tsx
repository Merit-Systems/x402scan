import { cn } from '@/lib/utils';

interface Props {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const OriginOverviewSection: React.FC<Props> = ({
  title,
  children,
  className,
}) => {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <h2 className="text-xl font-bold">{title}</h2>
      {children}
    </div>
  );
};
