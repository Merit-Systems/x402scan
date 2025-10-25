import { Section } from '@/app/_components/layout/page-utils';
import {
  FeedTable,
  LoadingFeedTable,
} from '@/app/composer/_components/feed-table';

export const Feed = () => {
  return (
    <FeedContainer>
      <FeedTable />
    </FeedContainer>
  );
};

export const LoadingFeed = () => {
  return (
    <FeedContainer>
      <LoadingFeedTable />
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
