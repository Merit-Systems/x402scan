'use client';

import { useMemo } from 'react';

import { api } from '@/trpc/client';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Favicons, LoadingFavicons } from '@/app/(app)/_components/favicon';
import { ActivityTimeframe } from '@/types/timeframes';
import { useQueries } from '@tanstack/react-query';

interface Props {
  sender: string;
}

export const BuyerTopServers: React.FC<Props> = ({ sender }) => {
  const { data: sellers, isLoading } = api.public.buyers.all.sellers.useQuery({
    sender,
    sorting: { id: 'tx_count', desc: true },
    pagination: {
      page_size: 3,
      page: 0,
    },
    timeframe: ActivityTimeframe.ThirtyDays,
  });

  if (isLoading || !sellers) {
    return <LoadingBuyerTopServers />;
  }

  if (sellers.items.length === 0) {
    return <span className="text-xs text-muted-foreground">–</span>;
  }

  return (
    <TopServersFavicons recipients={sellers.items.map(s => s.recipient)} />
  );
};

const TopServersFavicons: React.FC<{ recipients: string[] }> = ({
  recipients,
}) => {
  const utils = api.useUtils();

  const originQueries = useQueries({
    queries: recipients.map(address => ({
      queryKey: ['buyer-top-origins', address],
      queryFn: () => utils.public.origins.list.origins.fetch({ address }),
      staleTime: 60_000,
    })),
  });

  const isLoading = originQueries.some(q => q.isLoading);

  const origins = useMemo(() => {
    if (isLoading) return [];
    return originQueries
      .flatMap(q => q.data ?? [])
      .filter(
        (origin, index, self) =>
          self.findIndex(o => o.id === origin.id) === index
      )
      .slice(0, 3);
  }, [originQueries, isLoading]);

  if (isLoading) {
    return <LoadingBuyerTopServers />;
  }

  if (origins.length === 0) {
    return <span className="text-xs text-muted-foreground">–</span>;
  }

  const favicons = origins.map(o => o.favicon);
  const hostnames = origins.map(o => new URL(o.origin).hostname);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex justify-center">
          <Favicons
            favicons={favicons}
            numToShow={3}
            iconContainerClassName="size-5"
          />
        </div>
      </TooltipTrigger>
      <TooltipContent className="flex flex-col gap-1">
        <p className="text-xs font-medium">Top servers</p>
        {hostnames.map(hostname => (
          <p key={hostname} className="text-xs font-mono">
            {hostname}
          </p>
        ))}
      </TooltipContent>
    </Tooltip>
  );
};

export const LoadingBuyerTopServers = () => {
  return (
    <div className="flex justify-center">
      <LoadingFavicons count={3} iconContainerClassName="size-5" />
    </div>
  );
};
