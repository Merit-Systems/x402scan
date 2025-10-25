'use client';

import { X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ModelProviderIcon } from '@/app/_components/model-icon';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

import { capabilityColors, capabilityIcons, modelProviderNames } from './utils';
import type { LanguageModelCapability } from './types';

import { useModelSelect } from './use-model-select';

import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { LanguageModel } from './types';
import { languageModels } from './models';
import { PromptInputButton } from '@/components/ai-elements/prompt-input';

const MODEL_HEIGHT = 36;
const NUM_MODELS_TO_SHOW = 5;

// Shared content component for both dropdown and drawer
const ModelSelectContent: React.FC<{
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCapabilities: LanguageModelCapability[];
  selectedProviders: string[];
  toggleCapability: (capability: LanguageModelCapability) => void;
  toggleProvider: (provider: string) => void;
  handleModelSelect: (model: LanguageModel) => void;
  availableProviders: string[];
  filteredModels: LanguageModel[];
}> = ({
  searchQuery,
  setSearchQuery,
  selectedProviders,
  toggleProvider,
  handleModelSelect,
  availableProviders,
  filteredModels,
}) => (
  <Command
    filter={(value, search) => {
      const model = filteredModels.find(m => m.modelId === value);
      if (!model) return 0;

      const nameMatch = model.name.toLowerCase().includes(search.toLowerCase())
        ? 1
        : 0;
      const descriptionMatch = model.description
        ?.toLowerCase()
        .includes(search.toLowerCase())
        ? 1
        : 0;

      return nameMatch || descriptionMatch;
    }}
    className="gap-2 bg-transparent"
  >
    <CommandInput
      placeholder="Search models..."
      value={searchQuery}
      onValueChange={setSearchQuery}
    />
    <div>
      <div className="text-muted-foreground mb-1.5 px-2 text-xs font-medium">
        Providers
      </div>
      <div className="no-scrollbar flex gap-1 overflow-x-auto px-2">
        {availableProviders.map(provider => (
          <Badge
            key={provider}
            variant={
              selectedProviders.includes(provider) ? 'default' : 'outline'
            }
            className="shrink-0 cursor-pointer gap-1 px-1.5 py-0.5"
            onClick={() => toggleProvider(provider)}
          >
            <ModelProviderIcon provider={provider} className="size-3" />
            {modelProviderNames[provider]}
          </Badge>
        ))}
      </div>
    </div>
    {/* <div>
      <div className="text-muted-foreground mb-1.5 px-2 text-xs font-medium">
        Capabilities
      </div>
      <div className="no-scrollbar flex gap-1 overflow-x-auto px-2">
        {Object.values(LanguageModelCapability).map(capability => {
          const Icon = capabilityIcons[capability];
          const content = (
            <Badge
              key={capability}
              variant={
                selectedCapabilities.includes(capability)
                  ? 'default'
                  : 'outline'
              }
              className="shrink-0 cursor-pointer gap-1 px-1.5 py-0.5"
              onClick={() => toggleCapability(capability)}
            >
              {Icon && <Icon className="size-3" />}
              {capabilityLabels[capability]}
            </Badge>
          );

          return content;
        })}
      </div>
    </div> */}
    <CommandList
      className={cn('w-full max-w-full overflow-x-hidden overflow-y-auto p-0')}
      style={{
        height: `${MODEL_HEIGHT * (NUM_MODELS_TO_SHOW + 0.5)}px`,
      }}
      gradientClassName="from-background md:from-popover"
    >
      <CommandEmpty>No models found.</CommandEmpty>
      <CommandGroup className="p-0">
        {filteredModels.map(model => (
          <CommandItem
            key={model.modelId}
            value={model.modelId}
            onSelect={() => handleModelSelect(model)}
            className={cn(
              'flex w-full max-w-full cursor-pointer items-center gap-2 rounded-none px-3 py-2 transition-colors'
            )}
          >
            {/* Name, provider, new badge stack */}
            <div className="flex max-w-full min-w-0 flex-1 flex-shrink-0 items-center gap-2 overflow-hidden">
              <ModelProviderIcon
                provider={model.provider}
                className="size-4 flex-shrink-0"
              />
              <span className="truncate text-sm font-medium">{model.name}</span>
              {model.isNew && (
                <Badge variant="secondary" className="h-5 text-xs">
                  New
                </Badge>
              )}
            </div>
            {/* Capabilities justified to the right */}
            <div className="flex flex-1 justify-end gap-1">
              {model.capabilities?.map(capability => {
                const Icon = capabilityIcons[capability];
                return (
                  <Badge
                    key={capability}
                    variant="capability"
                    className={`h-5 gap-1 px-1 text-xs ${capabilityColors[capability]}`}
                  >
                    {Icon && <Icon className="size-3" />}
                  </Badge>
                );
              })}
            </div>
          </CommandItem>
        ))}
      </CommandGroup>
    </CommandList>
  </Command>
);

interface Props {
  model: LanguageModel;
  setModel: (model: LanguageModel) => void;
}
export const ModelSelect: React.FC<Props> = ({ model, setModel }) => {
  const isMobile = useIsMobile();

  const {
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
  } = useModelSelect({ model, setModel });

  // Get unique providers from models
  const availableProviders = Array.from(
    new Set(languageModels.map(model => model.provider))
  );

  const triggerButton = (
    <PromptInputButton
      variant="outline"
      size={isMobile ? 'icon' : 'sm'}
      className={cn('justify-center bg-transparent md:justify-start')}
      onClick={event => {
        const target = event.target as HTMLElement;
        const isNativeSearchToggle = target.closest(
          '[data-native-search-toggle="true"]'
        );
        if (!isNativeSearchToggle) {
          setIsOpen(!isOpen);
        }
      }}
    >
      {model ? (
        <>
          <ModelProviderIcon provider={model.provider} className="size-4" />
          <span className="hidden flex-1 truncate text-left md:block text-xs">
            {model.name}
          </span>
        </>
      ) : (
        <>
          <X className="mr-2 size-4" />
          Select a model
        </>
      )}
    </PromptInputButton>
  );

  const contentProps = {
    searchQuery,
    setSearchQuery,
    selectedCapabilities,
    selectedProviders,
    toggleCapability,
    toggleProvider,
    handleModelSelect,
    availableProviders,
    filteredModels,
  };

  return (
    <>
      {isMobile ? (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="sr-only">
              <DrawerTitle>Model Selector</DrawerTitle>
            </DrawerHeader>
            <ModelSelectContent {...contentProps} />
          </DrawerContent>
        </Drawer>
      ) : (
        <DropdownMenu
          open={isOpen}
          onOpenChange={isOpen ? setIsOpen : undefined}
        >
          <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-xs overflow-hidden p-0 md:w-lg"
            align="start"
            sideOffset={8}
          >
            <ModelSelectContent {...contentProps} />
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
};
