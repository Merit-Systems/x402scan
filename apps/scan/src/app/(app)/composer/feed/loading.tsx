import { Body, Heading } from "@/app/(app)/_components/layout/page-utils";
import { LoadingFeedTable } from "./_components/table";

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
