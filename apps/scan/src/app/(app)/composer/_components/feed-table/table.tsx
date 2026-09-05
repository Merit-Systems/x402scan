"use client";

import { DataTable, DataTableLoading } from "@/components/ui/data-table";

import { columns } from "./columns";
import { api } from "@/trpc/client";
import { useState } from "react";

interface Props {
  limit?: number;
}

export const FeedTableContent = ({ limit = 10 }: Props) => {
  const [page, setPage] = useState(0);

  const [feed] = api.public.agents.activity.feed.useSuspenseQuery({
    pagination: {
      page: page,
      page_size: limit,
    },
  });

  return (
    <DataTable
      columns={columns}
      data={feed.items}
      pageSize={limit}
      pagination={{
        pageIndex: page,
        pageSize: limit,
        pageCount: feed.total_pages,
      }}
      onPaginationChange={({ pageIndex }) => {
        setPage(pageIndex);
      }}
    />
  );
};

export const LoadingFeedTableContent = ({ limit = 10 }: Props) => {
  return <DataTableLoading columns={columns} rowCount={limit} />;
};
