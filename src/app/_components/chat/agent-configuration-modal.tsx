'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToolSelector } from '@/app/_components/chat/tool-selector';
import type { AgentConfigurationState } from '@/app/_hooks/use-agent-configuration';
import type { Visibility } from '@prisma/client';

const models = [
  { name: 'GPT 4o', value: 'gpt-4o' },
  { name: 'GPT 5', value: 'gpt-5' },
];

interface AgentConfigurationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialConfig?: AgentConfigurationState | null;
  onSave: (config: AgentConfigurationState) => Promise<void>;
  mode: 'create' | 'edit';
}

export function AgentConfigurationModal({
  open,
  onOpenChange,
  initialConfig,
  onSave,
  mode,
}: AgentConfigurationModalProps) {
  const [name, setName] = useState('');
  const [model, setModel] = useState<string>('gpt-4o');
  const [tools, setTools] = useState<string[]>([]);
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant.');
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when modal opens/closes or initial config changes
  useEffect(() => {
    if (open && initialConfig) {
      setName(initialConfig.id ?? '');
      setModel(initialConfig.model);
      setTools(initialConfig.tools);
      setSystemPrompt(initialConfig.systemPrompt);
      setVisibility(initialConfig.visibility);
    } else if (open && !initialConfig) {
      // Reset to defaults for new agent
      setName('');
      setModel('gpt-4o');
      setTools([]);
      setSystemPrompt('You are a helpful AI assistant.');
      setVisibility('private');
    }
  }, [open, initialConfig]);

  const handleSave = async () => {
    setIsSaving(true);
    
    const config: AgentConfigurationState = {
      ...(initialConfig?.id ? { id: initialConfig.id } : {}),
      model,
      tools,
      systemPrompt,
      visibility,
    };

    await onSave(config);
    setIsSaving(false);
    onOpenChange(false);
  };

  const canSave = systemPrompt.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Agent' : 'Edit Agent Configuration'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Agent Name - Only for display in edit mode */}
          {mode === 'edit' && initialConfig?.id && (
            <div className="space-y-2">
              <Label htmlFor="agent-name">Agent ID</Label>
              <Input
                id="agent-name"
                value={initialConfig.id}
                disabled
                className="bg-muted"
              />
            </div>
          )}

          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger id="model" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tool Selection */}
          <div className="space-y-2">
            <Label>Tools</Label>
            <div className="flex items-center gap-2">
              <ToolSelector selectedTools={tools} onToolsChange={setTools} />
              <span className="text-sm text-muted-foreground">
                {tools.length === 0 ? 'No tools selected' : `${tools.length} tool${tools.length > 1 ? 's' : ''} selected`}
              </span>
            </div>
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <Label htmlFor="system-prompt">System Prompt</Label>
            <Textarea
              id="system-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Enter the system prompt for your agent..."
              className="min-h-32"
            />
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Select
              value={visibility}
              onValueChange={(value) => setVisibility(value as Visibility)}
            >
              <SelectTrigger id="visibility" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="public">Public</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!canSave || isSaving}
          >
            {isSaving ? 'Saving...' : mode === 'create' ? 'Create Agent' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

