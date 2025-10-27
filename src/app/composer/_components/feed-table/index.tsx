import { api, HydrateClient } from '@/trpc/server';
import { FeedTableContent, LoadingFeedTableContent } from './table';
import { Suspense } from 'react';

interface Props {
  limit?: number;
}

export const FeedTable = async ({ limit = 10 }: Props) => {
  await api.public.agents.activity.feed.prefetch({
    pagination: {
      page_size: limit,
      page: 0,
    },
  });

  return (
    <HydrateClient>
      <Suspense fallback={<LoadingFeedTableContent />}>
        <FeedTableContent limit={limit} />
      </Suspense>
    </HydrateClient>
  );
};

export const LoadingFeedTable = ({ limit = 10 }: Props) => {
  return <LoadingFeedTableContent limit={limit} />;
};
