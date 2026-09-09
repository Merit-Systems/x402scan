import { Suspense } from "react";

import { Body } from "@/app/(app)/_components/deferred/page-utils";
import { auth } from "@/auth";

import { Agents } from "./_components/agents";
import { Feed } from "./_components/feed";
import { ComposerHomeHeading } from "./_components/heading";
import { OverallStats } from "./_components/stats";
import { Tools } from "./_components/tools";
import { YourAgents } from "./_components/your-agents";

export default function ComposerPage({ searchParams }: PageProps<"/composer">) {
  return (
    <>
      <ComposerHomeHeading />
      <Body>
        {/* This optional section has no placeholder until a user is known. */}
        <Suspense fallback={null}>
          <SignedInYourAgents />
        </Suspense>
        <Agents />
        <Tools searchParams={searchParams} />
        <Feed />
        <OverallStats />
      </Body>
    </>
  );
}

async function SignedInYourAgents() {
  const session = await auth();
  return session?.user.id ? <YourAgents userId={session.user.id} /> : null;
}
