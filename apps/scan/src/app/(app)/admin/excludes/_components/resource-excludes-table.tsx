"use client";

import { useMemo, useState } from "react";
import { LoadableDataTable } from "@/app/(app)/admin/_components/loadable-data-table";
import { createColumns } from "./columns";
import { api, type RouterOutputs } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Ban, CheckCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Favicon } from "@/app/(app)/_components/favicon";

type Resource =
  RouterOutputs["admin"]["resources"]["excludes"]["searchResources"][number];

const PAGE_SIZE = 25;

const getInvocationCount = ({ _count: counts }: Resource) => counts.invocations;

export const ResourceExcludesTable = () => {
  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);

  const utils = api.useUtils();

  const { data: searchResults, isLoading: isSearching } =
    api.admin.resources.excludes.searchResources.useQuery({
      search: searchQuery,
    });

  const { data: existingExcludes, isLoading: isLoadingExcludes } =
    api.admin.resources.excludes.list.useQuery();

  const createMutation = api.admin.resources.excludes.create.useMutation({
    onSuccess: () => {
      toast.success("Resource excluded successfully");
      void utils.admin.resources.excludes.list.invalidate();
      void utils.admin.resources.excludes.searchResources.invalidate();
      setSelectedResource(null);
    },
    onError: (error) => {
      toast.error(`Failed to exclude resource: ${error.message}`);
    },
  });

  const deleteMutation =
    api.admin.resources.excludes.deleteByResourceId.useMutation({
      onSuccess: () => {
        toast.success("Resource included successfully");
        void utils.admin.resources.excludes.list.invalidate();
        void utils.admin.resources.excludes.searchResources.invalidate();
        setSelectedResource(null);
      },
      onError: (error) => {
        toast.error(`Failed to include resource: ${error.message}`);
      },
    });

  // Filter resources to show only those with existing excludes or search results
  const resources: Resource[] = searchQuery
    ? (searchResults ?? [])
    : (existingExcludes?.map((exclude) => exclude.resource) ?? []);

  const paginatedResources = resources.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );
  const hasNextPage = resources.length > (page + 1) * PAGE_SIZE;

  const handleRowClick = (resource: Resource) => {
    setSelectedResource(resource);
  };
  const columns = useMemo(
    () => createColumns(setSelectedResource),
    [setSelectedResource]
  );

  const handleToggleExclude = () => {
    if (!selectedResource) return;

    const isExcluded = !!selectedResource.excluded;

    if (isExcluded) {
      // Remove from excludes
      deleteMutation.mutate({ resourceId: selectedResource.id });
    } else {
      // Add to excludes
      createMutation.mutate({ resourceId: selectedResource.id });
    }
  };

  const isLoading = createMutation.isPending || deleteMutation.isPending;

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
        isLoading={isSearching || isLoadingExcludes}
        onRowClick={handleRowClick}
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
        <Dialog
          open={!!selectedResource}
          onOpenChange={(open) => {
            if (!open) setSelectedResource(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedResource.excluded ? "Include" : "Exclude"} Resource
              </DialogTitle>
              <DialogDescription>
                {selectedResource.excluded
                  ? "Remove this resource from the exclusion list to allow agents to use it."
                  : "Add this resource to the exclusion list to prevent agents from using it."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="type-supporting-body type-emphasis">
                  Resource
                </div>
                <div className="type-supporting-body break-all text-muted-foreground">
                  {selectedResource.resource}
                </div>
              </div>

              <div className="space-y-2">
                <div className="type-supporting-body type-emphasis">Origin</div>
                <div className="flex items-center gap-2">
                  <Favicon url={selectedResource.origin.favicon} />
                  <span className="type-supporting-body text-muted-foreground">
                    {selectedResource.origin.origin}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="space-y-2">
                  <div className="type-supporting-body type-emphasis">Type</div>
                  <Badge variant="secondary">{selectedResource.type}</Badge>
                </div>

                <div className="space-y-2">
                  <div className="type-supporting-body type-emphasis">
                    X402 Version
                  </div>
                  <Badge variant="outline">
                    v{selectedResource.x402Version}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="type-supporting-body type-emphasis">
                    Invocations
                  </div>
                  <Badge variant="outline">
                    {getInvocationCount(selectedResource)}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="type-supporting-body type-emphasis">
                  Current Status
                </div>
                <Badge
                  variant={
                    selectedResource.excluded ? "destructive" : "default"
                  }
                  className="flex w-fit items-center gap-1"
                >
                  {selectedResource.excluded ? (
                    <>
                      <Ban className="size-3" />
                      Excluded
                    </>
                  ) : (
                    <>
                      <CheckCircle className="size-3" />
                      Active
                    </>
                  )}
                </Badge>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedResource(null);
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant={selectedResource.excluded ? "default" : "destructive"}
                onClick={handleToggleExclude}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {selectedResource.excluded ? (
                  <>
                    <CheckCircle className="mr-2 size-4" />
                    Include Resource
                  </>
                ) : (
                  <>
                    <Ban className="mr-2 size-4" />
                    Exclude Resource
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
