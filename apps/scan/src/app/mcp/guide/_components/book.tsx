import { cn } from '@/lib/utils';

export const Book: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div className={cn('flex rounded-md overflow-hidden', className)}>
      {children}
    </div>
  );
};

export const BookBinding: React.FC<{ className?: string }> = ({
  className,
}) => {
  return (
    <div
      className={cn(
        'w-2 bg-linear-to-r shrink-0 shadow-inner',
        'from-[#2e2e2e] via-[#3e3e3e] to-[#2e2e2e]',
        className
      )}
    />
  );
};

export const BookCover: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'relative flex-1 bg-linear-to-br',
        'from-neutral-500 to-[#2c2f30]',
        'dark:from-neutral-500 dark:to-[#2c2f30]',
        className
      )}
    >
      {/* Inner shadow / edge highlight */}
      <div className="absolute inset-0 rounded-r-md shadow-[inset_0_1px_0_0_rgba(0,0,0,0.1)]" />
      {children}
    </div>
  );
};

export const BookContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center h-15',
        className
      )}
    >
      {children}
    </div>
  );
};
