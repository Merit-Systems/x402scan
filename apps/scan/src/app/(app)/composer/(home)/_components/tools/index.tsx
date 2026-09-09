import { Suspense } from "react";

import { Section } from "@/app/(app)/_components/deferred/page-utils";

import { LoadingToolsTable, ToolsTable } from "./table";

import type { ToolSortId } from "@/lib/table-sort-options";
import type { TableSorting } from "@/lib/table-state";

// Note: No HydrateClient here - parent page.tsx provides it
// Prefetch is done in page.tsx
interface ToolsProps {
  sorting: TableSorting<ToolSortId>;
}

export const Tools = ({ sorting }: ToolsProps) => {
  return (
    <ToolsContainer>
      <Suspense fallback={<LoadingToolsTable sorting={sorting} />}>
        <ToolsTable sorting={sorting} />
      </Suspense>
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

interface ToolsContainerProps {
  children: React.ReactNode;
}

const ToolsContainer = ({ children }: ToolsContainerProps) => {
  return (
    <Section title="Top Tools" description="Discover the most popular tools">
      {children}
    </Section>
  );
};
