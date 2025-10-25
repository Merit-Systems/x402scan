import { Body, Heading } from '@/app/_components/layout/page-utils';
import { LoadingFeedTable } from '../_components/feed-table';

export default function LoadingFeedPage() {
  return (
    <div>
      <Heading title="Feed" description="Recent x402scan agent activities" />
      <Body>
        <LoadingFeedTable limit={15} />
      </Body>
    </div>
  );
}
