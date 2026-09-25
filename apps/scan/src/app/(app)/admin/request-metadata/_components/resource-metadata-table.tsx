"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
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
      search: searchQuery ?? undefined,
    });

  const { data: existingMetadata, isLoading: isLoadingMetadata } =
    api.admin.resources.requestMetadata.list.useQuery();

  // Create a map of existing metadata by resource ID for quick lookup
  const metadataMap = new Map(
    existingMetadata?.map((meta) => [meta.resourceId, meta]) ?? []
  );

  // Filter resources to show only those with existing metadata or search results
  const resources = searchQuery
    ? (searchResults ?? [])
    : (existingMetadata?.map((meta) => meta.resource) ?? []);

  const paginatedResources = resources.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );
  const hasNextPage = resources.length > (page + 1) * PAGE_SIZE;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setSearchQuery("")} variant="outline" size="sm">
          Clear
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={
          paginatedResources as RouterOutputs["admin"]["resources"]["requestMetadata"]["searchResources"]
        }
        pageSize={PAGE_SIZE}
        isLoading={isSearching || isLoadingMetadata}
        onRowClick={(row) => setSelectedResource(row.original)}
        page={page}
        onPageChange={setPage}
        hasNextPage={hasNextPage}
      />

      {selectedResource && (
        <EditMetadataModal
          open={!!selectedResource}
          onOpenChange={(open: boolean) => !open && setSelectedResource(null)}
          resource={selectedResource}
          existingMetadata={metadataMap.get(selectedResource.id)}
        />
      )}
    </div>
  );
};
