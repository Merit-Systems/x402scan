'use client';

import { useState } from 'react';
import { Tag, Plus, X, Trash2 } from 'lucide-react';
import { api } from '@/trpc/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import type { PaginatedQueryParams } from '@/lib/pagination';

interface EditTagModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceId: string;
  resourceName: string;
  pagination: PaginatedQueryParams;
  selectedTagIds: string[];
  setSelectedTagIds: (tagIds: string[]) => void;
}

export function EditTagModal({
  open,
  onOpenChange,
  resourceId,
  resourceName,
  pagination,
  selectedTagIds,
  setSelectedTagIds,
}: EditTagModalProps) {
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const utils = api.useUtils();

  const { data: allTags = [] } = api.public.resources.tags.list.useQuery();
  const { data: resourceTags = [] } =
    api.public.resources.tags.getByResource.useQuery(resourceId, {
      enabled: open,
    });

  function invalidateResourcesList() {
    void utils.public.resources.list.paginated.invalidate({
      pagination,
      ...(selectedTagIds.length > 0
        ? {
            AND: [
              {
                tags: {
                  some: {
                    tagId: {
                      in: selectedTagIds,
                    },
                  },
                },
              },
            ],
          }
        : {}),
    });
  }

  const createTag = api.admin.resources.tags.create.useMutation({
    onSuccess: () => {
      void utils.public.resources.tags.list.invalidate();
      setNewTagName('');
      setNewTagColor('#3b82f6');
    },
  });

  const assignTag = api.admin.resources.tags.assign.useMutation({
    onSuccess: () => {
      void utils.public.resources.tags.list.invalidate();
      void utils.public.resources.tags.getByResource.invalidate(resourceId);
      invalidateResourcesList();
    },
  });

  const unassignTag = api.admin.resources.tags.unassign.useMutation({
    onSuccess: () => {
      invalidateResourcesList();
    },
  });

  const deleteTag = api.admin.resources.tags.delete.useMutation({
    onSuccess: () => {
      void utils.public.resources.tags.list.invalidate();
      void utils.public.resources.tags.getByResource.invalidate(resourceId);
      invalidateResourcesList();
      setTagToDelete(null);
      setDeleteConfirmOpen(false);
    },
  });

  const assignedTagIds = new Set(resourceTags.map(rt => rt.tag.id));

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    createTag.mutate({
      name: newTagName.trim(),
      color: newTagColor,
    });
  };

  const handleToggleTag = (tagId: string) => {
    if (assignedTagIds.has(tagId)) {
      unassignTag.mutate({
        resourceId,
        tagId,
      });
    } else {
      assignTag.mutate({
        resourceId,
        tagId,
      });
    }
  };

  const handleDeleteClick = (tag: { id: string; name: string }) => {
    setTagToDelete(tag);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (tagToDelete) {
      deleteTag.mutate(tagToDelete.id);
      setSelectedTagIds(selectedTagIds.filter(id => id !== tagToDelete.id));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="size-4" />
            Edit Tags
          </DialogTitle>
          <DialogDescription className="text-xs break-all">
            {resourceName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create new tag section */}
          <div className="space-y-3 pb-4 border-b">
            <Label className="text-sm font-medium">Create New Tag</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Tag name"
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleCreateTag();
                    }
                  }}
                />
              </div>
              <Input
                type="color"
                value={newTagColor}
                onChange={e => setNewTagColor(e.target.value)}
                className="w-20 cursor-pointer"
              />
              <Button
                size="sm"
                onClick={handleCreateTag}
                disabled={!newTagName.trim() || createTag.isPending}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          {/* Available tags */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Available Tags</Label>
            {allTags.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tags available. Create one above.
              </p>
            ) : (
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {allTags.map(tag => {
                  const isAssigned = assignedTagIds.has(tag.id);
                  return (
                    <ContextMenu key={tag.id}>
                      <ContextMenuTrigger asChild>
                        <div className="flex items-center justify-between p-2 rounded-md border hover:bg-accent transition-colors">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div
                              className="size-4 rounded-sm flex-shrink-0"
                              style={{ backgroundColor: tag.color }}
                            />
                            <span className="text-sm font-medium break-all">
                              {tag.name}
                            </span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              ({tag._count.resourcesTags})
                            </span>
                          </div>
                          <Button
                            size="xs"
                            variant={isAssigned ? 'destructive' : 'default'}
                            onClick={() => handleToggleTag(tag.id)}
                            disabled={
                              assignTag.isPending || unassignTag.isPending
                            }
                          >
                            {isAssigned ? (
                              <>
                                <X className="size-3" />
                                Remove
                              </>
                            ) : (
                              <>
                                <Plus className="size-3" />
                                Add
                              </>
                            )}
                          </Button>
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem
                          variant="destructive"
                          onClick={() => handleDeleteClick(tag)}
                          disabled={deleteTag.isPending}
                        >
                          <Trash2 className="size-4" />
                          Delete Tag
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Tag"
        description={
          tagToDelete
            ? `Are you sure you want to delete the tag "${tagToDelete.name}"? This will remove it from all resources.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />
    </Dialog>
  );
}
