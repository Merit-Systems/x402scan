'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api, type RouterOutputs } from '@/trpc/client';
import { toast } from 'sonner';
import { Loader2, Save, Trash2 } from 'lucide-react';

type Resource =
  RouterOutputs['admin']['resources']['requestMetadata']['searchResources'][number];
type Metadata =
  RouterOutputs['admin']['resources']['requestMetadata']['list'][number];

interface EditMetadataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: Resource;
  existingMetadata?: Metadata;
}

export const EditMetadataModal = ({
  open,
  onOpenChange,
  resource,
  existingMetadata,
}: EditMetadataModalProps) => {
  const [headers, setHeaders] = useState('');
  const [body, setBody] = useState('');
  const [queryParams, setQueryParams] = useState('');
  const [inputSchema, setInputSchema] = useState('');

  const utils = api.useUtils();

  const createMutation = api.admin.resources.requestMetadata.create.useMutation(
    {
      onSuccess: () => {
        toast.success('Request metadata created successfully');
        void utils.admin.resources.requestMetadata.list.invalidate();
        void utils.admin.resources.requestMetadata.searchResources.invalidate();
        onOpenChange(false);
      },
      onError: error => {
        toast.error(`Failed to create metadata: ${error.message}`);
      },
    }
  );

  const updateMutation = api.admin.resources.requestMetadata.update.useMutation(
    {
      onSuccess: () => {
        toast.success('Request metadata updated successfully');
        void utils.admin.resources.requestMetadata.list.invalidate();
        void utils.admin.resources.requestMetadata.searchResources.invalidate();
        onOpenChange(false);
      },
      onError: error => {
        toast.error(`Failed to update metadata: ${error.message}`);
      },
    }
  );

  const deleteMutation = api.admin.resources.requestMetadata.delete.useMutation(
    {
      onSuccess: () => {
        toast.success('Request metadata deleted successfully');
        void utils.admin.resources.requestMetadata.list.invalidate();
        void utils.admin.resources.requestMetadata.searchResources.invalidate();
        onOpenChange(false);
      },
      onError: error => {
        toast.error(`Failed to delete metadata: ${error.message}`);
      },
    }
  );

  // Initialize form data when modal opens or existing metadata changes
  useEffect(() => {
    if (open) {
      if (existingMetadata) {
        setHeaders(JSON.stringify(existingMetadata.headers, null, 2));
        setBody(JSON.stringify(existingMetadata.body, null, 2));
        setQueryParams(JSON.stringify(existingMetadata.queryParams, null, 2));
        setInputSchema(JSON.stringify(existingMetadata.inputSchema, null, 2));
      } else {
        setHeaders('{}');
        setBody('{}');
        setQueryParams('{}');
        setInputSchema('{}');
      }
    }
  }, [open, existingMetadata]);

  const parseJson = (jsonString: string) => {
    try {
      return JSON.parse(jsonString) as Record<string, unknown>;
    } catch (error) {
      throw new Error(
        `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleSave = () => {
    try {
      const metadataData = {
        resourceId: resource.id,
        headers: parseJson(headers),
        body: parseJson(body),
        queryParams: parseJson(queryParams),
        inputSchema: parseJson(inputSchema),
      };

      if (existingMetadata) {
        updateMutation.mutate({
          id: existingMetadata.id,
          ...metadataData,
        });
      } else {
        createMutation.mutate(metadataData);
      }
    } catch (error) {
      toast.error(
        `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleDelete = () => {
    if (
      existingMetadata &&
      confirm('Are you sure you want to delete this metadata?')
    ) {
      deleteMutation.mutate({ id: existingMetadata.id });
    }
  };

  const isLoading =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingMetadata ? 'Edit' : 'Create'} Request Metadata
          </DialogTitle>
          <DialogDescription>
            Configure request metadata for {resource.resource}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="headers">
          <TabsList className="flex w-full">
            <TabsTrigger value="headers" variant="github" className="flex-1">
              Headers
            </TabsTrigger>
            <TabsTrigger value="body" variant="github" className="flex-1">
              Body
            </TabsTrigger>
            <TabsTrigger
              value="queryParams"
              variant="github"
              className="flex-1"
            >
              Query Params
            </TabsTrigger>
            <TabsTrigger
              value="inputSchema"
              variant="github"
              className="flex-1"
            >
              Input Schema
            </TabsTrigger>
          </TabsList>

          <TabsContent value="headers" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="headers">Headers (JSON)</Label>
              <Textarea
                id="headers"
                value={headers}
                onChange={e => setHeaders(e.target.value)}
                placeholder='{"Content-Type": "application/json", "Authorization": "Bearer token"}'
                className="min-h-[200px] font-mono text-sm"
              />
            </div>
          </TabsContent>

          <TabsContent value="body" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="body">Body (JSON)</Label>
              <Textarea
                id="body"
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder='{"key": "value", "nested": {"property": "value"}}'
                className="min-h-[200px] font-mono text-sm"
              />
            </div>
          </TabsContent>

          <TabsContent value="queryParams" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="queryParams">Query Parameters (JSON)</Label>
              <Textarea
                id="queryParams"
                value={queryParams}
                onChange={e => setQueryParams(e.target.value)}
                placeholder='{"param1": "value1", "param2": "value2"}'
                className="min-h-[200px] font-mono text-sm"
              />
            </div>
          </TabsContent>

          <TabsContent value="inputSchema" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inputSchema">Input Schema (JSON)</Label>
              <Textarea
                id="inputSchema"
                value={inputSchema}
                onChange={e => setInputSchema(e.target.value)}
                placeholder='{"type": "object", "properties": {"field": {"type": "string"}}}'
                className="min-h-[200px] font-mono text-sm"
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between">
          <div>
            {existingMetadata && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
              >
                {deleteMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {existingMetadata ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
