import { connection } from "next/server";
import { api, HydrateClient } from "@/trpc/server";
import { Suspense } from "react";

import { Section } from "@/app/(app)/_components/deferred/page-utils";
import {
  FeedTableContent,
  LoadingFeedTableContent,
} from "@/app/(app)/composer/_components/feed-table/table";

export const Feed = () => {
  return (
    <FeedContainer>
      <Suspense fallback={<LoadingFeedTableContent />}>
        <Data />
      </Suspense>
    </FeedContainer>
  );
};

export const LoadingFeed = () => {
  return (
    <FeedContainer>
      <LoadingFeedTableContent />
    </FeedContainer>
  );
};

interface FeedContainerProps {
  children: React.ReactNode;
}

const FeedContainer = ({ children }: FeedContainerProps) => {
  return (
    <Section
      title="Feed"
      description="Recent x402scan agent activities"
      href="/composer/feed"
    >
      {children}
    </Section>
  );
};

async function Data() {
  await connection();
  void api.public.agents.activity.feed.prefetch({
    pagination: { page: 0, page_size: 10 },
  });
  return (
    <HydrateClient>
      <FeedTableContent />
    </HydrateClient>
  );
}
