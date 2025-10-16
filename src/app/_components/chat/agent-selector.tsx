'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusIcon, Settings2Icon, TrashIcon } from 'lucide-react';
import { AgentConfigurationModal } from '@/app/_components/chat/agent-configuration-modal';
import type { AgentConfigurationState, UseAgentConfigurationReturn } from '@/app/_hooks/use-agent-configuration';

interface AgentSelectorProps {
  agentConfig: UseAgentConfigurationReturn;
  onAgentChange?: (agentId: string | null) => void;
}

export function AgentSelector({ agentConfig, onAgentChange }: AgentSelectorProps) {
  const {
    configurations,
    isLoadingConfigurations,
    currentAgent,
    isDirty,
    selectAgent,
    updateLocalAgent,
    saveAgent,
    createNewAgent,
    deleteAgent,
    isSaving,
  } = agentConfig;

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  const handleSelectAgent = (value: string) => {
    if (value === 'none') {
      selectAgent(null);
      onAgentChange?.(null);
    } else {
      selectAgent(value);
      onAgentChange?.(value);
    }
  };

  const handleNewAgent = () => {
    setModalMode('create');
    selectAgent(null);
    setShowModal(true);
  };

  const handleEditAgent = () => {
    if (currentAgent) {
      setModalMode('edit');
      setShowModal(true);
    }
  };

  const handleDeleteAgent = async () => {
    if (currentAgent?.id && confirm('Are you sure you want to delete this agent configuration?')) {
      await deleteAgent(currentAgent.id);
      selectAgent(null);
      onAgentChange?.(null);
    }
  };

  const handleSave = async () => {
    // If there's no ID, it's a new agent - open modal in create mode
    if (currentAgent && !currentAgent.id) {
      setModalMode('create');
      setShowModal(true);
    } else {
      // Otherwise save existing agent directly
      await saveAgent();
    }
  };

  const handleSaveFromModal = async (config: AgentConfigurationState) => {
    if (modalMode === 'create') {
      await createNewAgent(config);
    } else {
      updateLocalAgent(config);
      await saveAgent();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentAgent?.id ?? 'none'}
        onValueChange={handleSelectAgent}
        disabled={isLoadingConfigurations}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={isLoadingConfigurations ? 'Loading...' : 'Select agent'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No Agent</SelectItem>
          {configurations?.map((config) => (
            <SelectItem key={config.id} value={config.id}>
              {config.model} ({config.tools.length} tools)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleNewAgent}
        aria-label="Create new agent"
      >
        <PlusIcon className="size-4" />
      </Button>

      {currentAgent && (
        <>
          {currentAgent.id && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEditAgent}
                aria-label="Edit agent"
              >
                <Settings2Icon className="size-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDeleteAgent}
                aria-label="Delete agent"
              >
                <TrashIcon className="size-4" />
              </Button>
            </>
          )}

          {isDirty && (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              aria-label="Save agent changes"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          )}
        </>
      )}

      <AgentConfigurationModal
        open={showModal}
        onOpenChange={setShowModal}
        initialConfig={currentAgent}
        onSave={handleSaveFromModal}
        mode={modalMode}
      />
    </div>
  );
}

