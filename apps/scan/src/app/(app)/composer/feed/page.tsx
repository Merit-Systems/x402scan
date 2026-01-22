import { Body, Heading } from '@/app/_components/layout/page-utils';
import { FeedTable } from '../_components/feed-table';

export default function FeedPage() {
  return (
    <>
      <Heading title="Feed" description="Your feed of activities" />
      <Body>
        <FeedTable limit={15} />
      </Body>
    </>
  );
}
