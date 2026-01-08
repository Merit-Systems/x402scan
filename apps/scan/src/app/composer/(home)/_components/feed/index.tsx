import { Section } from '@/app/_components/layout/page-utils';
import {
  FeedTableContent,
  LoadingFeedTableContent,
} from '@/app/composer/_components/feed-table/table';
import { Suspense } from 'react';

// Note: No HydrateClient here - parent page.tsx provides it
// Prefetch is done in page.tsx
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

const FeedContainer = ({ children }: { children: React.ReactNode }) => {
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
