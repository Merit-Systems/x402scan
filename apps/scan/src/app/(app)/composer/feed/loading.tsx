import { Body, Heading } from "@/app/(app)/_components/deferred/page-utils";

import { LoadingFeedTable } from "./_components/table";

export default function LoadingFeedPage() {
  return (
    <div>
      <Heading title="Feed" description="Your feed of activities" />
      <Body>
        <LoadingFeedTable limit={15} />
      </Body>
    </div>
  );
}
