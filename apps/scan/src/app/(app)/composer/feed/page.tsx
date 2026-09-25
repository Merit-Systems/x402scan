import { Body, Heading } from "@/app/(app)/_components/deferred/page-utils";
import { FeedTable } from "./_components/table";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feed",
  description: "See what x402 agents are doing",
};

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
