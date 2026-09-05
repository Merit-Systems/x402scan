"use client";

import { useMemo, useState } from "react";
import { LoadableDataTable } from "@/app/(app)/admin/_components/loadable-data-table";
import { createColumns } from "./columns";
import { api, type RouterOutputs } from "@/trpc/client";
import { EditMetadataModal } from "./edit-metadata-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type Resource =
  RouterOutputs["admin"]["resources"]["requestMetadata"]["searchResources"][number];

const PAGE_SIZE = 25;

export const ResourceMetadataTable = () => {
  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);

  const { data: searchResults, isLoading: isSearching } =
    api.admin.resources.requestMetadata.searchResources.useQuery({
      search: searchQuery,
    });

  const { data: existingMetadata, isLoading: isLoadingMetadata } =
    api.admin.resources.requestMetadata.list.useQuery();

  // Create a map of existing metadata by resource ID for quick lookup
  const metadataMap = new Map(
    existingMetadata?.map((meta) => [meta.resourceId, meta]) ?? []
  );

  // Filter resources to show only those with existing metadata or search results
  const resources: Resource[] = searchQuery
    ? (searchResults ?? [])
    : (existingMetadata?.map((meta) => meta.resource) ?? []);

  const paginatedResources = resources.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );
  const hasNextPage = resources.length > (page + 1) * PAGE_SIZE;
  const columns = useMemo(
    () => createColumns(setSelectedResource),
    [setSelectedResource]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            className=""
          />
        </div>
        <Button
          onClick={() => {
            setSearchQuery("");
          }}
          variant="outline"
          size="sm"
        >
          Clear
        </Button>
      </div>

      <LoadableDataTable
        columns={columns}
        data={paginatedResources}
        pageSize={PAGE_SIZE}
        isLoading={isSearching || isLoadingMetadata}
        onRowClick={setSelectedResource}
        pagination={{
          pageIndex: page,
          pageSize: PAGE_SIZE,
          pageCount: hasNextPage ? page + 2 : page + 1,
        }}
        onPaginationChange={({ pageIndex }) => {
          setPage(pageIndex);
        }}
      />

      {selectedResource && (
        <EditMetadataModal
          open={!!selectedResource}
          onOpenChange={(open: boolean) => {
            if (!open) setSelectedResource(null);
          }}
          resource={selectedResource}
          existingMetadata={metadataMap.get(selectedResource.id)}
        />
      )}
    </div>
  );
};
