import { Section } from '@/app/_components/layout/page-utils';
import { ToolsSortingProvider } from '@/app/_contexts/sorting/tools/provider';
import { defaultToolsSorting } from '@/app/_contexts/sorting/tools/default';
import { LoadingToolsTable, ToolsTable } from './table';
import { Suspense } from 'react';

// Note: No HydrateClient here - parent page.tsx provides it
// Prefetch is done in page.tsx
export const Tools = () => {
  return (
    <ToolsContainer>
      <ToolsSortingProvider initialSorting={defaultToolsSorting}>
        <Suspense fallback={<LoadingToolsTable />}>
          <ToolsTable />
        </Suspense>
      </ToolsSortingProvider>
    </ToolsContainer>
  );
};

export const LoadingTools = () => {
  return (
    <ToolsContainer>
      <LoadingToolsTable />
    </ToolsContainer>
  );
};

const ToolsContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <Section title="Top Tools" description="Discover the most popular tools">
      {children}
    </Section>
  );
};
