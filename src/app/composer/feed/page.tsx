import { Body, Heading } from '@/app/_components/layout/page-utils';
import { HydrateClient } from '@/trpc/server';
import { FeedTable } from '../_components/feed-table';

export default function FeedPage() {
  return (
    <HydrateClient>
      <Heading title="Feed" description="Your feed of activities" />
      <Body>
        <FeedTable limit={15} />
      </Body>
    </HydrateClient>
  );
}
