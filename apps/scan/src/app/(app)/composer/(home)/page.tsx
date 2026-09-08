import { Body } from "@/app/(app)/_components/deferred/page-utils";
import { auth } from "@/auth";

import { Agents } from "./_components/agents";
import { Feed } from "./_components/feed";
import { ComposerHomeHeading } from "./_components/heading";
import { OverallStats } from "./_components/stats";
import { Tools } from "./_components/tools";
import { YourAgents } from "./_components/your-agents";

export default async function ComposerPage({
  searchParams,
}: PageProps<"/composer">) {
  const session = await auth();
  return (
    <>
      <ComposerHomeHeading />
      <Body>
        {session?.user.id && <YourAgents userId={session.user.id} />}
        <Agents />
        <Tools searchParams={searchParams} />
        <Feed />
        <OverallStats />
      </Body>
    </>
  );
}
