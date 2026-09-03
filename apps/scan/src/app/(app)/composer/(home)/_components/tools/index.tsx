import { Section } from "@/app/(app)/_components/layout/page-utils";
import { LoadingToolsTable, ToolsTable } from "./table";
import { Suspense } from "react";
import type { ToolSortId } from "@/lib/table-sort-options";
import type { TableSorting } from "@/lib/table-state";

// Note: No HydrateClient here - parent page.tsx provides it
// Prefetch is done in page.tsx
export const Tools = ({ sorting }: { sorting: TableSorting<ToolSortId> }) => {
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

const ToolsContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <Section title="Top Tools" description="Discover the most popular tools">
      {children}
    </Section>
  );
};
