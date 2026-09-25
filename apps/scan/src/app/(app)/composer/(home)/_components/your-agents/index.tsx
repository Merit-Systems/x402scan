import { Suspense } from "react";

import { Section } from "@/app/(app)/_components/deferred/page-utils";
import { api, HydrateClient } from "@/trpc/server";
import { ActivityTimeframe } from "@/types/timeframes";

import { LoadingAgentCard } from "../lib/agent-card";
import { YourAgentsContent } from "./content";

interface YourAgentsProps {
  userId: string;
}

export const YourAgents = ({ userId }: YourAgentsProps) => (
  <Suspense fallback={<LoadingYourAgents />}>
    <YourAgentsData userId={userId} />
  </Suspense>
);

interface YourAgentsDataProps {
  userId: string;
}

async function YourAgentsData({ userId }: YourAgentsDataProps) {
  void api.public.agents.list.prefetch({
    timeframe: ActivityTimeframe.ThirtyDays,
    pagination: { page: 0, page_size: 100 },
    userId,
  });
  return (
    <HydrateClient>
      <AgentsContainer>
        <YourAgentsContent userId={userId} />
      </AgentsContainer>
    </HydrateClient>
  );
}

const LoadingYourAgents = () => {
  return (
    <AgentsContainer>
      {Array.from({ length: 4 }).map((_, index) => (
        <LoadingAgentCard key={index} />
      ))}
    </AgentsContainer>
  );
};

interface AgentsContainerProps {
  children: React.ReactNode;
}

const AgentsContainer = ({ children }: AgentsContainerProps) => {
  return (
    <Section title="Your Agents" description="Agents you have created or used">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-4 lg:grid-cols-4">
        {children}
      </div>
    </Section>
  );
};
