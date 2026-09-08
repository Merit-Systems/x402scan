import { Suspense } from "react";

import { connection } from "next/server";

import {
  FeedTableContent,
  LoadingFeedTableContent,
} from "@/app/(app)/composer/_components/feed-table/table";
import { api, HydrateClient } from "@/trpc/server";

interface Props {
  limit?: number;
}

export const FeedTable = async ({ limit = 10 }: Props) => {
  await connection();
  void api.public.agents.activity.feed.prefetch({
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
