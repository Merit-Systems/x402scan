import { Suspense } from "react";

import { Card } from "@/components/ui/card";

import { Section } from "@/app/(app)/_components/deferred/page-utils";
import { HydrateClient } from "@/trpc/server";

import { LoadingActivityCharts } from "./charts";
import { ActivityContent } from "./content";

import type { RouterOutputs } from "@/trpc/client";

interface Props {
  agentConfiguration: NonNullable<RouterOutputs["public"]["agents"]["get"]>;
}

export const Activity: React.FC<Props> = ({ agentConfiguration }) => {
  return (
    <HydrateClient>
      <ActivityContainer>
        <Suspense fallback={<LoadingActivityCharts />}>
          <ActivityContent agentConfiguration={agentConfiguration} />
        </Suspense>
      </ActivityContainer>
    </HydrateClient>
  );
};

export const LoadingActivity = () => {
  return (
    <ActivityContainer>
      <LoadingActivityCharts />
    </ActivityContainer>
  );
};

const ActivityContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <Section title="Usage">
      <Card className="overflow-hidden">{children}</Card>
    </Section>
  );
};
