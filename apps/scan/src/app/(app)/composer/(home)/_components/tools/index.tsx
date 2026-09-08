import { Suspense } from "react";

import { Section } from "@/app/(app)/_components/deferred/page-utils";
import { DEFAULT_TOOLS_SORTING, TOOL_SORT_IDS } from "@/lib/table-sort-options";
import { parseTableSorting } from "@/lib/table-state";
import { api, HydrateClient } from "@/trpc/server";

import { LoadingToolsTable, ToolsTable } from "./table";

export const Tools = ({
  searchParams,
}: Pick<PageProps<"/composer">, "searchParams">) => (
  <ToolsContainer>
    <Suspense fallback={<LoadingToolsTable />}>
      <ToolsData searchParams={searchParams} />
    </Suspense>
  </ToolsContainer>
);

async function ToolsData({
  searchParams,
}: Pick<PageProps<"/composer">, "searchParams">) {
  const sorting = parseTableSorting(
    await searchParams,
    TOOL_SORT_IDS,
    DEFAULT_TOOLS_SORTING
  );
  void api.public.tools.top.prefetch({
    pagination: { page: 0, page_size: 10 },
    sorting,
  });
  return (
    <HydrateClient>
      <Suspense
        key={`${sorting.id}:${String(sorting.desc)}`}
        fallback={<LoadingToolsTable sorting={sorting} />}
      >
        <ToolsTable sorting={sorting} />
      </Suspense>
    </HydrateClient>
  );
}

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
