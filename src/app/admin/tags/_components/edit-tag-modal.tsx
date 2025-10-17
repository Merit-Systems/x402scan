'use client';

import { useState } from 'react';
import { Tag, Plus, X } from 'lucide-react';
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
import type { paginatedQuerySchema } from '@/lib/pagination';
import type { z } from 'zod';

interface EditTagModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceId: string;
  resourceName: string;
  pagination: z.infer<ReturnType<typeof paginatedQuerySchema>>;
}

export function EditTagModal({
  open,
  onOpenChange,
  resourceId,
  resourceName,
  pagination,
}: EditTagModalProps) {
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');

  const utils = api.useUtils();

  const { data: allTags = [] } = api.resourceTags.list.useQuery();
  const { data: resourceTags = [] } = api.resourceTags.getByResource.useQuery(
    resourceId,
    { enabled: open }
  );

  const createTag = api.resourceTags.create.useMutation({
    onSuccess: () => {
      void utils.resourceTags.list.invalidate();
      setNewTagName('');
      setNewTagColor('#3b82f6');
    },
  });

  const assignTag = api.resourceTags.assign.useMutation({
    onSuccess: () => {
      void utils.resourceTags.list.invalidate();
      void utils.resourceTags.getByResource.invalidate(resourceId);
      void utils.resources.list.paginated.invalidate(pagination);
    },
  });

  const unassignTag = api.resourceTags.unassign.useMutation({
    onSuccess: () => {
      void utils.resourceTags.list.invalidate();
      void utils.resourceTags.getByResource.invalidate(resourceId);
      void utils.resources.list.paginated.invalidate(pagination);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="size-4" />
            Edit Tags
          </DialogTitle>
          <DialogDescription className="text-xs truncate">
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
                    <div
                      key={tag.id}
                      className="flex items-center justify-between p-2 rounded-md border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="size-4 rounded-sm"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-sm font-medium">{tag.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({tag._count.resourcesTags})
                        </span>
                      </div>
                      <Button
                        size="xs"
                        variant={isAssigned ? 'destructive' : 'default'}
                        onClick={() => handleToggleTag(tag.id)}
                        disabled={assignTag.isPending || unassignTag.isPending}
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
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
