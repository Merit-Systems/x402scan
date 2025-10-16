'use client';

import { useState } from 'react';
import { api } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ToolSelectorProps {
  selectedTools: string[];
  onToolsChange: (tools: string[]) => void;
}

export function ToolSelector({
  selectedTools,
  onToolsChange,
}: ToolSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { data: tools, isLoading } = api.availableTools.list.useQuery();

  const toggleTool = (toolName: string) => {
    if (selectedTools.includes(toolName)) {
      onToolsChange(selectedTools.filter(t => t !== toolName));
    } else {
      onToolsChange([...selectedTools, toolName]);
    }
  };

  const filteredTools = (tools ?? []).filter(
    (tool: {
      name: string;
      description: string;
      resource: string;
      network: string;
      maxAmountRequired: string;
    }) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q)
      );
    }
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <span className="text-xs">
            {selectedTools.length > 0
              ? `${selectedTools.length} tool${selectedTools.length > 1 ? 's' : ''}`
              : 'Select tools'}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent
        className="w-[96vw] lg:w-[90vw] sm:max-w-none lg:max-w-none p-0 sm:p-6"
        style={{ maxWidth: '72rem' }}
      >
        <DialogHeader className="sticky top-0 z-10 pb-4 px-6 sm:px-0 pr-14 mt-5">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-xl">Select Tools</DialogTitle>
            <div className="ml-auto w-full max-w-sm">
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by name or description"
                aria-label="Search tools"
                className="h-8"
              />
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-2">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading tools...
            </div>
          ) : filteredTools && filteredTools.length > 0 ? (
            <div className="space-y-3 px-6 sm:px-0 mr-1">
              {filteredTools.map(
                (tool: {
                  name: string;
                  description: string;
                  resource: string;
                  network: string;
                  maxAmountRequired: string;
                }) => (
                  <label
                    key={tool.resource}
                    className="flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTools.includes(tool.name)}
                      onChange={() => toggleTool(tool.name)}
                      className="mt-1 size-4 cursor-pointer rounded border-gray-300"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="font-medium leading-none">
                        {tool.name}
                      </div>
                      <div className="text-sm leading-relaxed text-muted-foreground">
                        {tool.description}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {tool.maxAmountRequired} on {tool.network}
                      </div>
                    </div>
                  </label>
                )
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {query.trim() ? 'No matching tools' : 'No tools available'}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
