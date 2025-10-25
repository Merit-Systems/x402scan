'use client';

import { useState } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';
import { api, type RouterOutputs } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Ban, CheckCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Favicon } from '@/app/_components/favicon';

type Resource =
  RouterOutputs['admin']['resources']['excludes']['searchResources'][number];

const PAGE_SIZE = 25;

export const ResourceExcludesTable = () => {
  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);

  const utils = api.useUtils();

  const { data: searchResults, isLoading: isSearching } =
    api.admin.resources.excludes.searchResources.useQuery({
      search: searchQuery ?? undefined,
    });

  const { data: existingExcludes, isLoading: isLoadingExcludes } =
    api.admin.resources.excludes.list.useQuery();

  const createMutation = api.admin.resources.excludes.create.useMutation({
    onSuccess: () => {
      toast.success('Resource excluded successfully');
      void utils.admin.resources.excludes.list.invalidate();
      void utils.admin.resources.excludes.searchResources.invalidate();
      setSelectedResource(null);
    },
    onError: error => {
      toast.error(`Failed to exclude resource: ${error.message}`);
    },
  });

  const deleteMutation =
    api.admin.resources.excludes.deleteByResourceId.useMutation({
      onSuccess: () => {
        toast.success('Resource included successfully');
        void utils.admin.resources.excludes.list.invalidate();
        void utils.admin.resources.excludes.searchResources.invalidate();
        setSelectedResource(null);
      },
      onError: error => {
        toast.error(`Failed to include resource: ${error.message}`);
      },
    });

  // Filter resources to show only those with existing excludes or search results
  const resources = searchQuery
    ? (searchResults ?? [])
    : (existingExcludes?.map(exclude => exclude.resource) ?? []);

  const paginatedResources = resources.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );
  const hasNextPage = resources.length > (page + 1) * PAGE_SIZE;

  const handleRowClick = (resource: Resource) => {
    setSelectedResource(resource);
  };

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
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setSearchQuery('')} variant="outline" size="sm">
          Clear
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={
          paginatedResources as RouterOutputs['admin']['resources']['excludes']['searchResources']
        }
        pageSize={PAGE_SIZE}
        isLoading={isSearching || isLoadingExcludes}
        onRowClick={row => handleRowClick(row.original)}
        page={page}
        onPageChange={setPage}
        hasNextPage={hasNextPage}
      />

      {selectedResource && (
        <Dialog
          open={!!selectedResource}
          onOpenChange={open => !open && setSelectedResource(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedResource.excluded ? 'Include' : 'Exclude'} Resource
              </DialogTitle>
              <DialogDescription>
                {selectedResource.excluded
                  ? 'Remove this resource from the exclusion list to allow agents to use it.'
                  : 'Add this resource to the exclusion list to prevent agents from using it.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Resource</div>
                <div className="text-sm text-muted-foreground break-all">
                  {selectedResource.resource}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Origin</div>
                <div className="flex items-center gap-2">
                  <Favicon url={selectedResource.origin.favicon} />
                  <span className="text-sm text-muted-foreground">
                    {selectedResource.origin.origin}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Type</div>
                  <Badge variant="secondary">{selectedResource.type}</Badge>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">X402 Version</div>
                  <Badge variant="outline">
                    v{selectedResource.x402Version}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Invocations</div>
                  <Badge variant="outline">
                    {selectedResource._count?.invocations ?? 0}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Current Status</div>
                <Badge
                  variant={
                    selectedResource.excluded ? 'destructive' : 'default'
                  }
                  className="flex gap-1 w-fit items-center"
                >
                  {selectedResource.excluded ? (
                    <>
                      <Ban className="h-3 w-3" />
                      Excluded
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Active
                    </>
                  )}
                </Badge>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedResource(null)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant={selectedResource.excluded ? 'default' : 'destructive'}
                onClick={handleToggleExclude}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedResource.excluded ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Include Resource
                  </>
                ) : (
                  <>
                    <Ban className="mr-2 h-4 w-4" />
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
