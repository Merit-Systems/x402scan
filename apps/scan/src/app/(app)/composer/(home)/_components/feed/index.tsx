import { Suspense } from "react";

import { connection } from "next/server";

import { Section } from "@/app/(app)/_components/deferred/page-utils";
import {
  FeedTableContent,
  LoadingFeedTableContent,
} from "@/app/(app)/composer/_components/feed-table/table";
import { api, HydrateClient } from "@/trpc/server";

export const Feed = () => {
  return (
    <FeedContainer>
      <Suspense fallback={<LoadingFeedTableContent />}>
        <Data />
      </Suspense>
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
