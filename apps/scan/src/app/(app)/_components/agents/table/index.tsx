import { Suspense } from "react";

import {
  AgentsTable as AgentsTableComponent,
  LoadingAgentsTable,
} from "@/app/(app)/_components/agents/table/table";

import { api, HydrateClient } from "@/trpc/server";

import type { AgentSortId } from "@/lib/table-sort-options";
import type { TableSorting } from "@/lib/table-state";

import type { RouterInputs } from "@/trpc/client";

interface Props {
  input: Omit<
    RouterInputs["public"]["agents"]["list"],
    "sorting" | "pagination"
  >;
  limit?: number;
  sorting: TableSorting<AgentSortId>;
}

export const AgentsTable: React.FC<Props> = ({
  input,
  limit = 10,
  sorting,
}) => {
  void api.public.agents.list.prefetch({
    ...input,
    pagination: { page: 0, page_size: limit },
    sorting,
  });

  return (
    <HydrateClient>
      <Suspense fallback={<LoadingAgentsTable sorting={sorting} />}>
        <AgentsTableComponent input={input} limit={limit} sorting={sorting} />
      </Suspense>
    </HydrateClient>
  );
};
