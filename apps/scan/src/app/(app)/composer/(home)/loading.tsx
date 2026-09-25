import { Body } from "@/app/(app)/_components/deferred/page-utils";

import { LoadingAgents } from "./_components/agents";
import { LoadingFeed } from "./_components/feed";
import { ComposerHomeHeading } from "./_components/heading";
import { LoadingOverallStats } from "./_components/stats";
import { LoadingTools } from "./_components/tools";

export default function ComposerLoading() {
  return (
    <div>
      <ComposerHomeHeading />
      <Body>
        <LoadingAgents />
        <LoadingTools />
        <LoadingFeed />
        <LoadingOverallStats />
      </Body>
    </div>
  );
}
