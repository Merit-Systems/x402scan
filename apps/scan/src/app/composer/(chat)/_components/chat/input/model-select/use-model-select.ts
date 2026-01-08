'use client';

import { useMemo, useState } from 'react';
import type { LanguageModel, LanguageModelCapability } from './types';
import { languageModels } from './models';

interface UseModelSelectProps {
  model: LanguageModel | undefined;
  setModel: (model: LanguageModel) => void;
}

export const useModelSelect = ({ setModel }: UseModelSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCapabilities, setSelectedCapabilities] = useState<
    LanguageModelCapability[]
  >([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);

  const handleModelSelect = (model: LanguageModel) => {
    setModel(model);
    setIsOpen(false);
  };

  const sortedModels = useMemo(() => {
    const providers = Array.from(
      new Set(languageModels.map(model => model.provider))
    );
    const modelsByProvider = providers.reduce(
      (acc, provider) => {
        acc[provider] = languageModels.filter(
          model => model.provider === provider
        );
        return acc;
      },
      {} as Record<string, typeof languageModels>
    );

    const result: typeof languageModels = [];
    let index = 0;
    while (result.length < languageModels.length) {
      for (const provider of providers) {
        const providerModels = modelsByProvider[provider];
        const model = providerModels?.[index];
        if (model) {
          result.push(model);
        }
      }
      index++;
    }
    return result;
  }, []);

  const filteredModels = useMemo(() => {
    return sortedModels.filter(model => {
      const matchesCapabilities =
        selectedCapabilities.length === 0 ||
        selectedCapabilities.some(capability =>
          model.capabilities?.includes(capability)
        );

      const matchesProviders =
        selectedProviders.length === 0 ||
        selectedProviders.includes(model.provider);

      return matchesCapabilities && matchesProviders;
    });
  }, [sortedModels, selectedCapabilities, selectedProviders]);

  const toggleCapability = (capability: LanguageModelCapability) => {
    setSelectedCapabilities(prev =>
      prev.includes(capability)
        ? prev.filter(c => c !== capability)
        : [...prev, capability]
    );
  };

  const toggleProvider = (provider: string) => {
    setSelectedProviders(prev =>
      prev.includes(provider)
        ? prev.filter(p => p !== provider)
        : [...prev, provider]
    );
  };

  return {
    models: filteredModels,
    isOpen,
    setIsOpen,
    searchQuery,
    setSearchQuery,
    selectedCapabilities,
    selectedProviders,
    toggleCapability,
    toggleProvider,
    handleModelSelect,
  };
};
