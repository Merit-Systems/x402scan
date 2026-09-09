import { Suspense } from "react";

import { Section } from "@/app/(app)/_components/deferred/page-utils";

import { LoadingAgentCard } from "../lib/agent-card";
import { AgentsContent } from "./content";

// Note: No HydrateClient here - parent page.tsx provides it
export const Agents = () => {
  return (
    <AgentsContainer>
      <Suspense fallback={<LoadingAgentsContent />}>
        <AgentsContent />
      </Suspense>
    </AgentsContainer>
  );
};

export const LoadingAgents = () => {
  return (
    <AgentsContainer>
      <LoadingAgentsContent />
    </AgentsContainer>
  );
};

const LoadingAgentsContent = () => {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <LoadingAgentCard key={index} />
      ))}
    </>
  );
};

interface AgentsContainerProps {
  children: React.ReactNode;
}

const AgentsContainer = ({ children }: AgentsContainerProps) => {
  return (
    <Section
      title="Top Agents"
      description="Try out the most popular agents"
      href="/composer/agents"
    >
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-4 lg:grid-cols-4">
        {children}
      </div>
    </Section>
  );
};
