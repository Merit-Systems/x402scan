'use client';

import { Loader2, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useRegisterFromOrigin } from '@/hooks/use-register-from-origin';

export const RefreshButton: React.FC<{ origin: string }> = ({ origin }) => {
  const { register, isRegistering } = useRegisterFromOrigin({
    showToasts: true,
  });

  const handleRefresh = () => {
    void register(origin);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          onClick={() => void handleRefresh()}
          disabled={isRegistering}
        >
          {isRegistering ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Re-sync server resources from discovery manifest</p>
      </TooltipContent>
    </Tooltip>
  );
};
