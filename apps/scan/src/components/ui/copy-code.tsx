import { CopyButton } from './copy-button';
import { Skeleton } from './skeleton';

import { cn } from '@/lib/utils';

interface Props {
  className?: string;
  toastMessage: string;
  isLoading?: boolean;
  code: string;
  textClassName?: string;
  copyButtonClassName?: string;
}

export const CopyCode: React.FC<Props> = ({
  className,
  textClassName,
  copyButtonClassName,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex items-center w-full border rounded-md overflow-hidden pl-2 pr-1 py-1 bg-muted',
        className
      )}
    >
      {props.isLoading ? (
        <Skeleton className="h-5 flex-1" />
      ) : (
        <p
          className={cn(
            'flex-1 overflow-x-auto whitespace-nowrap font-mono text-sm no-scrollbar pr-2',
            textClassName
          )}
        >
          {props.code}
        </p>
      )}

      <CopyButton
        text={props.isLoading ? '' : props.code}
        toastMessage={props.isLoading ? '' : props.toastMessage}
        isLoading={props.isLoading}
        className={copyButtonClassName}
      />
    </div>
  );
};
