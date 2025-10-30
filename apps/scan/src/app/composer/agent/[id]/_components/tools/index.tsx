import { Section } from '@/app/_components/layout/page-utils';

import { LoadingToolCard, ToolCard } from './card';

import type { RouterOutputs } from '@/trpc/client';

interface Props {
  resources: RouterOutputs['public']['agents']['get']['resources'];
}

export const Tools: React.FC<Props> = ({ resources }) => {
  return (
    <ToolsContainer>
      {resources.map(resource => (
        <ToolCard key={resource.id} resource={resource} />
      ))}
    </ToolsContainer>
  );
};

export const LoadingTools = () => {
  return (
    <ToolsContainer>
      {Array.from({ length: 4 }).map((_, index) => (
        <LoadingToolCard key={index} />
      ))}
    </ToolsContainer>
  );
};

const ToolsContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <Section title="Tools" description="Tools available to the agent">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </Section>
  );
};
