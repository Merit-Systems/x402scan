import { useMemo } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { cn } from '@/lib/utils';

import type { ParsedX402Response } from '@/lib/x402/schema';

interface Props {
  response: ParsedX402Response;
}

export const Status: React.FC<Props> = ({ response }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Dot />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{'Response Details'}</DialogTitle>
        </DialogHeader>
        <div className="max-h-60 overflow-auto space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Raw Response</h4>
            <pre className="text-xs font-mono whitespace-pre-wrap">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface DotProps {
  onClick?: () => void;
}

const Dot: React.FC<DotProps> = ({ onClick }) => {
  const statusColor = useMemo(() => {
    return 'bg-green-600';
  }, []);

  return (
    <div
      className={cn('w-3 h-3 rounded-full shrink-0 bg-green-600', statusColor)}
      onClick={onClick}
    />
  );
};
