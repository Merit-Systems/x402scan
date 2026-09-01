"use client";

import { useState, useMemo } from "react";
import { LoadableDataTable } from "@/app/(app)/admin/_components/loadable-data-table";
import { createToolSpendingColumns } from "./columns";
import { api, type RouterOutputs } from "@/trpc/client";
import { WalletBreakdownModal } from "../wallet-spending/breakdown-modal";
import { useToolSpendingSorting } from "@/app/(app)/admin/_contexts/sorting/tool-spending/hook";

type ToolSpending =
  RouterOutputs["admin"]["spending"]["byTool"]["items"][number];

type ModalState = { type: "none" } | { type: "breakdown"; tool: ToolSpending };

const PAGE_SIZE = 50;

export const ToolSpendingTable = () => {
  const [modalState, setModalState] = useState<ModalState>({ type: "none" });
  const [page, setPage] = useState(0);
  const { sorting } = useToolSpendingSorting();

  const { data, isLoading } = api.admin.spending.byTool.useQuery({
    pagination: {
      page: page,
      page_size: PAGE_SIZE,
    },
    sorting,
  });
  const tools = data?.items ?? [];
  const hasNextPage = data?.hasNextPage ?? false;

  const columns = useMemo(() => createToolSpendingColumns(), []);

  return (
    <div className="space-y-4">
      <LoadableDataTable
        columns={columns}
        data={tools}
        pageSize={PAGE_SIZE}
        isLoading={isLoading}
        onRowClick={(tool) => setModalState({ type: "breakdown", tool })}
        pagination={{
          pageIndex: page,
          pageSize: PAGE_SIZE,
          pageCount: hasNextPage ? page + 2 : page + 1,
        }}
        onPaginationChange={({ pageIndex }) => setPage(pageIndex)}
        getRowId={(row, index) => row?.resourceId ?? `loading-${index}`}
      />

      {modalState.type === "breakdown" && (
        <WalletBreakdownModal
          open={true}
          onOpenChange={(open) => !open && setModalState({ type: "none" })}
          resourceId={modalState.tool.resourceId}
          resourceUrl={modalState.tool.resourceUrl}
        />
      )}
    </div>
  );
};
