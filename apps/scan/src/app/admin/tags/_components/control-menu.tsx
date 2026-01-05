'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { MoreVertical } from 'lucide-react';
import { api, type RouterOutputs } from '@/trpc/client';
import { toast } from 'sonner';

type Resource =
  RouterOutputs['public']['resources']['list']['paginated']['items'][number];

type ControlMenuProps = {
  selectedResources?: Resource[];
  selectedTagIds?: string[];
  onSuccess?: () => void;
};

export const ControlMenu = ({
  selectedResources = [],
  selectedTagIds = [],
  onSuccess,
}: ControlMenuProps) => {
  const utils = api.useUtils();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<
    'selected' | 'all' | 'removeSubTags' | 'unassignAllSubTags' | null
  >(null);

  const { data: tags } = api.public.resources.tags.list.useQuery();
  const selectedTag =
    selectedTagIds.length === 1
      ? tags?.find(tag => tag.id === selectedTagIds[0])
      : null;

  const unassignAllFromAllMutation =
    api.admin.resources.tags.unassignAllFromAll.useMutation({
      onSuccess: () => {
        toast.success('All tags unassigned from all resources');
        void utils.public.resources.list.paginated.invalidate();
        onSuccess?.();
      },
      onError: error => {
        toast.error(`Failed to unassign tags: ${error.message}`);
      },
    });

  const unassignAllMutation = api.admin.resources.tags.unassignAll.useMutation({
    onSuccess: () => {
      toast.success('Tags unassigned successfully');
      void utils.public.resources.list.paginated.invalidate();
      onSuccess?.();
    },
    onError: error => {
      toast.error(`Failed to unassign tags: ${error.message}`);
    },
  });

  const removeSubTagsMutation =
    api.admin.resources.tags.removeSubTags.useMutation({
      onSuccess: () => {
        toast.success('Sub-tags removed successfully');
        void utils.public.resources.list.paginated.invalidate();
        onSuccess?.();
      },
      onError: error => {
        toast.error(`Failed to remove sub-tags: ${error.message}`);
      },
    });

  const unassignAllSubTagsMutation =
    api.admin.resources.tags.unassignAllSubTags.useMutation({
      onSuccess: () => {
        toast.success('All sub-tags removed, only main categories remain');
        void utils.public.resources.list.paginated.invalidate();
        void utils.public.resources.tags.list.invalidate();
        onSuccess?.();
      },
      onError: error => {
        toast.error(`Failed to remove sub-tags: ${error.message}`);
      },
    });

  const handleUnassignAllFromAll = () => {
    unassignAllFromAllMutation.mutate();
    setConfirmDialogOpen(null);
  };

  const handleUnassignFromSelected = () => {
    selectedResources.forEach(resource => {
      unassignAllMutation.mutate(resource.id);
    });
    setConfirmDialogOpen(null);
  };

  const handleRemoveSubTags = () => {
    if (selectedTagIds.length === 1 && selectedTagIds[0]) {
      removeSubTagsMutation.mutate(selectedTagIds[0]);
    }
    setConfirmDialogOpen(null);
  };

  const handleUnassignAllSubTags = () => {
    unassignAllSubTagsMutation.mutate();
    setConfirmDialogOpen(null);
  };

  const hasSelection = selectedResources.length > 0;
  const hasExactlyOneTag = selectedTagIds.length === 1;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreVertical className="size-4" />
            Control Menu
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            variant="destructive"
            disabled={!hasSelection || unassignAllMutation.isPending}
            onSelect={() => setConfirmDialogOpen('selected')}
          >
            Unassign Tags from Selected
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={!hasExactlyOneTag || removeSubTagsMutation.isPending}
            onSelect={() => setConfirmDialogOpen('removeSubTags')}
          >
            {selectedTag ? (
              <div className="flex items-center gap-2">
                <span>Remove Sub-tags from</span>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: selectedTag.color }}
                />
                <span className="font-medium">{selectedTag.name}</span>
              </div>
            ) : (
              'Remove Sub-tags from Selected Tag'
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={unassignAllSubTagsMutation.isPending}
            onSelect={() => setConfirmDialogOpen('unassignAllSubTags')}
          >
            Delete All Sub-tags (Keep Main Categories)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={unassignAllFromAllMutation.isPending}
            onSelect={() => setConfirmDialogOpen('all')}
          >
            Unassign All Tags (Database-wide)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmDialogOpen === 'selected'}
        onOpenChange={open => !open && setConfirmDialogOpen(null)}
        title="Unassign Tags from Selected"
        description={`Are you sure you want to unassign all tags from ${selectedResources.length} selected resource(s)? This action cannot be undone.`}
        confirmLabel="Unassign"
        onConfirm={handleUnassignFromSelected}
        variant="destructive"
      />

      <ConfirmDialog
        open={confirmDialogOpen === 'removeSubTags'}
        onOpenChange={open => !open && setConfirmDialogOpen(null)}
        title="Remove Sub-tags from Selected Tag"
        description={
          selectedTag
            ? `Are you sure you want to remove all OTHER tags from resources that have "${selectedTag.name}"? Only "${selectedTag.name}" will remain on those resources. This action cannot be undone.`
            : 'Are you sure you want to remove all OTHER tags from resources that have the selected tag? Only the selected tag will remain on those resources. This action cannot be undone.'
        }
        confirmLabel="Remove Sub-tags"
        onConfirm={handleRemoveSubTags}
        variant="destructive"
      />

      <ConfirmDialog
        open={confirmDialogOpen === 'unassignAllSubTags'}
        onOpenChange={open => !open && setConfirmDialogOpen(null)}
        title="Delete All Sub-tags (Keep Main Categories)"
        description="Are you sure you want to DELETE all tags from the database EXCEPT the main categories (Search, AI, Crypto, Trading, Utility, Random)? All sub-tags and their assignments will be permanently removed. This action cannot be undone."
        confirmLabel="Delete Sub-tags"
        onConfirm={handleUnassignAllSubTags}
        variant="destructive"
      />

      <ConfirmDialog
        open={confirmDialogOpen === 'all'}
        onOpenChange={open => !open && setConfirmDialogOpen(null)}
        title="Unassign All Tags (Database-wide)"
        description="Are you sure you want to unassign ALL tags from ALL resources in the database? This action cannot be undone."
        confirmLabel="Unassign All"
        onConfirm={handleUnassignAllFromAll}
        variant="destructive"
      />
    </>
  );
};
