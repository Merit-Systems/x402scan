'use client';

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/trpc/client';
import type { Visibility } from '@prisma/client';

export interface AgentConfigurationState {
  id?: string;
  model: string;
  tools: string[];
  systemPrompt: string;
  visibility: Visibility;
}

export interface UseAgentConfigurationReturn {
  // Data
  configurations: Array<{
    id: string;
    userId: string;
    model: string;
    tools: string[];
    systemPrompt: string;
    visibility: Visibility;
    createdAt: Date;
    updatedAt: Date;
  }> | undefined;
  isLoadingConfigurations: boolean;
  
  // Current agent state
  currentAgent: AgentConfigurationState | null;
  isDirty: boolean;
  
  // Methods
  selectAgent: (id: string | null) => void;
  updateLocalAgent: (updates: Partial<AgentConfigurationState>) => void;
  saveAgent: () => Promise<void>;
  createNewAgent: (config: Omit<AgentConfigurationState, 'id'>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  resetToSaved: () => void;
  
  // UI state
  isSaving: boolean;
  saveError: string | null;
}

const DEFAULT_AGENT: Omit<AgentConfigurationState, 'id'> = {
  model: 'gpt-4o',
  tools: [],
  systemPrompt: 'You are a helpful AI assistant.',
  visibility: 'private',
};

export const useAgentConfiguration = (): UseAgentConfigurationReturn => {
  const [currentAgent, setCurrentAgent] = useState<AgentConfigurationState | null>(null);
  const [savedAgent, setSavedAgent] = useState<AgentConfigurationState | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const utils = api.useUtils();

  // Fetch all configurations
  const { data: configurations, isLoading: isLoadingConfigurations } =
    api.agentConfigurations.getUserConfigurations.useQuery();

  // Mutations
  const createMutation = api.agentConfigurations.create.useMutation({
    onSuccess: () => {
      void utils.agentConfigurations.getUserConfigurations.invalidate();
    },
  });

  const updateMutation = api.agentConfigurations.update.useMutation({
    onSuccess: () => {
      void utils.agentConfigurations.getUserConfigurations.invalidate();
    },
  });

  const deleteMutation = api.agentConfigurations.delete.useMutation({
    onSuccess: () => {
      void utils.agentConfigurations.getUserConfigurations.invalidate();
    },
  });

  // Select an agent by ID
  const selectAgent = useCallback(
    (id: string | null) => {
      if (id === null) {
        // Reset to default state
        setCurrentAgent(null);
        setSavedAgent(null);
        setIsDirty(false);
        return;
      }

      const config = configurations?.find((c) => c.id === id);
      if (config) {
        const agentState: AgentConfigurationState = {
          id: config.id,
          model: config.model,
          tools: config.tools,
          systemPrompt: config.systemPrompt,
          visibility: config.visibility,
        };
        setCurrentAgent(agentState);
        setSavedAgent(agentState);
        setIsDirty(false);
      }
    },
    [configurations]
  );

  // Update local agent state (marks as dirty)
  const updateLocalAgent = useCallback((updates: Partial<AgentConfigurationState>) => {
    setCurrentAgent((prev) => {
      if (!prev) {
        // If no current agent, create a new one with defaults
        return { ...DEFAULT_AGENT, ...updates };
      }
      return { ...prev, ...updates };
    });
    setIsDirty(true);
  }, []);

  // Save agent (create or update)
  const saveAgent = useCallback(async () => {
    if (!currentAgent) return;

    setIsSaving(true);
    setSaveError(null);

    if (currentAgent.id) {
      // Update existing agent
      await updateMutation.mutateAsync({
        id: currentAgent.id,
        model: currentAgent.model,
        tools: currentAgent.tools,
        systemPrompt: currentAgent.systemPrompt,
        visibility: currentAgent.visibility,
      });
      setSavedAgent(currentAgent);
    } else {
      // Create new agent
      const created = await createMutation.mutateAsync({
        model: currentAgent.model,
        tools: currentAgent.tools,
        systemPrompt: currentAgent.systemPrompt,
        visibility: currentAgent.visibility,
      });
      const newAgentState = {
        id: created.id,
        model: created.model,
        tools: created.tools,
        systemPrompt: created.systemPrompt,
        visibility: created.visibility,
      };
      setCurrentAgent(newAgentState);
      setSavedAgent(newAgentState);
    }

    setIsDirty(false);
    setIsSaving(false);
  }, [currentAgent, createMutation, updateMutation]);

  // Create new agent
  const createNewAgent = useCallback(
    async (config: Omit<AgentConfigurationState, 'id'>) => {
      setIsSaving(true);
      setSaveError(null);

      const created = await createMutation.mutateAsync(config);
      const newAgentState = {
        id: created.id,
        model: created.model,
        tools: created.tools,
        systemPrompt: created.systemPrompt,
        visibility: created.visibility,
      };
      setCurrentAgent(newAgentState);
      setSavedAgent(newAgentState);
      setIsDirty(false);
      setIsSaving(false);
    },
    [createMutation]
  );

  // Delete agent
  const deleteAgent = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync({ id });
      if (currentAgent?.id === id) {
        setCurrentAgent(null);
        setSavedAgent(null);
        setIsDirty(false);
      }
    },
    [deleteMutation, currentAgent]
  );

  // Reset to saved state
  const resetToSaved = useCallback(() => {
    setCurrentAgent(savedAgent);
    setIsDirty(false);
  }, [savedAgent]);

  // Check if current state differs from saved state
  useEffect(() => {
    if (!currentAgent || !savedAgent) {
      setIsDirty(currentAgent !== savedAgent);
      return;
    }

    const isDifferent =
      currentAgent.model !== savedAgent.model ||
      currentAgent.systemPrompt !== savedAgent.systemPrompt ||
      currentAgent.visibility !== savedAgent.visibility ||
      JSON.stringify(currentAgent.tools) !== JSON.stringify(savedAgent.tools);

    setIsDirty(isDifferent);
  }, [currentAgent, savedAgent]);

  return {
    // Data
    configurations,
    isLoadingConfigurations,

    // Current agent state
    currentAgent,
    isDirty,

    // Methods
    selectAgent,
    updateLocalAgent,
    saveAgent,
    createNewAgent,
    deleteAgent,
    resetToSaved,

    // UI state
    isSaving,
    saveError,
  };
};

