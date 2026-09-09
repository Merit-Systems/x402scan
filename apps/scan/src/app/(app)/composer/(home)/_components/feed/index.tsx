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
        <FeedTableContent />
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
