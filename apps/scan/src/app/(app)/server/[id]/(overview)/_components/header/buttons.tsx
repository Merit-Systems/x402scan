'use client';

import { useState } from 'react';

import { Loader2, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { api } from '@/trpc/client';
import type { RouterOutputs } from '@/trpc/client';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { AgentCashCTA, LoadingAgentCashCTA } from './agentcash-cta';

interface Props {
  origin: NonNullable<RouterOutputs['public']['origins']['get']>;
}

const RefreshButton: React.FC<{ origin: string }> = ({ origin }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const utils = api.useUtils();
  const registerFromOrigin =
    api.public.resources.registerFromOrigin.useMutation();

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);

    try {
      const result = await registerFromOrigin.mutateAsync({ origin });

      if (!result.success) {
        toast.error('Refresh failed', {
          description:
            'error' in result ? result.error.message : 'Discovery failed',
        });
        return;
      }

      const parts: string[] = [];
      if (result.registered > 0) parts.push(`${result.registered} registered`);
      if (result.deprecated > 0) parts.push(`${result.deprecated} removed`);
      if (result.skipped > 0) parts.push(`${result.skipped} skipped`);
      if (result.failed > 0) parts.push(`${result.failed} failed`);

      const description =
        parts.length > 0 ? parts.join(', ') : 'Server is up to date';

      toast.success('Server refreshed', { description });

      void utils.public.resources.list.invalidate();
      void utils.public.origins.list.withResources.invalidate();
      void utils.public.sellers.bazaar.list.invalidate();
    } catch (err) {
      toast.error('Refresh failed', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          onClick={() => void handleRefresh()}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
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

export const HeaderButtons: React.FC<Props> = ({ origin }) => {
  return (
    <div className="flex items-start gap-3">
      <AgentCashCTA origin={origin} />
      <RefreshButton origin={origin.origin} />
    </div>
  );
};

export const LoadingHeaderButtons = () => {
  return <LoadingAgentCashCTA />;
};
