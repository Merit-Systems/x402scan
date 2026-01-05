import { Button } from '@/components/ui/button';
import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react';

type Props = {
  onRegenerate: () => void;
  message: string;
};

export const ErrorState: React.FC<Props> = ({
  message = 'You need to regenerate the message to continue.',
  onRegenerate,
}) => {
  return (
    <div className="w-fit max-w-full flex items-center gap-4 bg-transparent border rounded-md px-4 py-2">
      <div className="flex items-center gap-2">
        <AlertCircleIcon className="size-4 text-destructive shrink-0" />
        <div>
          <h3 className="text-sm font-bold text-destructive">Error</h3>
          <p className="text-xs">
            {message ?? 'You need to regenerate the message to continue.'}
          </p>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onRegenerate}>
        <RefreshCwIcon className="size-4" />
      </Button>
    </div>
  );
};
