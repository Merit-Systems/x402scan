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

interface ControlMenuProps {
  selectedResources?: Resource[];
  onSuccess?: () => void;
}

export const ControlMenu = ({
  selectedResources = [],
  onSuccess,
}: ControlMenuProps) => {
  const utils = api.useUtils();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<
    'selected' | 'all' | null
  >(null);

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

  const hasSelection = selectedResources.length > 0;

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
