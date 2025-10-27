import { Section } from '@/app/_components/layout/page-utils';
import { api, HydrateClient } from '@/trpc/server';
import { ToolsSortingProvider } from '@/app/_contexts/sorting/tools/provider';
import { defaultToolsSorting } from '@/app/_contexts/sorting/tools/default';
import { LoadingToolsTable, ToolsTable } from './table';
import { Suspense } from 'react';

export const Tools = async () => {
  await api.public.tools.top.prefetch({
    pagination: {
      page: 0,
      page_size: 10,
    },
    sorting: defaultToolsSorting,
  });

  return (
    <HydrateClient>
      <ToolsContainer>
        <ToolsSortingProvider initialSorting={defaultToolsSorting}>
          <Suspense fallback={<LoadingToolsTable />}>
            <ToolsTable />
          </Suspense>
        </ToolsSortingProvider>
      </ToolsContainer>
    </HydrateClient>
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
