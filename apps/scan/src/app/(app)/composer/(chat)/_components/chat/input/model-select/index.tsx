"use client";

import { Badge } from "@/components/ui/badge";
import { ModelProviderIcon } from "@/app/(app)/composer/(chat)/_components/model-icon";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { capabilityColors, capabilityIcons, modelProviderNames } from "./utils";
import type { LanguageModelCapability } from "../../../../_lib/language-models/types";

import { useModelSelect } from "./use-model-select";

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-is-mobile";
import type { LanguageModel } from "../../../../_lib/language-models/types";
import { languageModels } from "../../../../_lib/language-models/models";
import { PromptInputButton } from "@/components/ai-elements/prompt-input";

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
      const model = filteredModels.find((m) => m.modelId === value);
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
    className="gap-2"
  >
    <CommandInput
      placeholder="Search models..."
      value={searchQuery}
      onValueChange={setSearchQuery}
    />
    <div>
      <div className="type-emphasis mb-1.5 px-2 type-caption text-muted-foreground">
        Providers
      </div>
      <div className="no-scrollbar flex gap-1 overflow-x-auto px-2">
        {availableProviders.map((provider) => (
          <Badge
            key={provider}
            variant={
              selectedProviders.includes(provider) ? "default" : "outline"
            }
            className="shrink-0 cursor-pointer gap-1"
            onClick={() => {
              toggleProvider(provider);
            }}
          >
            <ModelProviderIcon provider={provider} className="size-3" />
            {modelProviderNames.get(provider)}
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
      className={cn("w-full max-w-full overflow-x-hidden overflow-y-auto ")}
      style={{
        height: `${String(MODEL_HEIGHT * (NUM_MODELS_TO_SHOW + 0.5))}px`,
      }}
    >
      <CommandEmpty>No models found.</CommandEmpty>
      <CommandGroup className="">
        {filteredModels.map((model) => (
          <CommandItem
            key={model.modelId}
            value={model.modelId}
            onSelect={() => {
              handleModelSelect(model);
            }}
            className={cn(
              "flex w-full max-w-full cursor-pointer items-center gap-2 "
            )}
          >
            {/* Name, provider, new badge stack */}
            <div className="flex max-w-full min-w-0 flex-1 shrink-0 items-center gap-2 overflow-hidden">
              <ModelProviderIcon
                provider={model.provider}
                className="size-4 shrink-0"
              />
              <span className="type-supporting-body type-emphasis truncate">
                {model.name}
              </span>
              {model.isNew && (
                <Badge variant="secondary" className=" ">
                  New
                </Badge>
              )}
            </div>
            {/* Capabilities justified to the right */}
            <div className="flex flex-1 justify-end gap-1">
              {model.capabilities?.map((capability) => {
                const Icon = capabilityIcons[capability];
                return (
                  <Badge
                    key={capability}
                    variant="secondary"
                    className={`gap-1 ${capabilityColors[capability]}`}
                  >
                    <Icon className="size-3" />
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
    new Set(languageModels.map((model) => model.provider))
  );

  const triggerButton = (
    <PromptInputButton
      variant="outline"
      size={isMobile ? "icon-sm" : "sm"}
      className={cn("justify-center bg-transparent md:justify-start")}
      onClick={(event) => {
        const isNativeSearchToggle =
          event.target instanceof Element
            ? event.target.closest('[data-native-search-toggle="true"]')
            : null;
        if (!isNativeSearchToggle) {
          setIsOpen(!isOpen);
        }
      }}
    >
      <ModelProviderIcon provider={model.provider} className="size-4" />
      <span className="hidden flex-1 truncate text-left type-caption md:block">
        {model.name}
      </span>
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
          <DropdownMenuTrigger render={triggerButton} />
          <DropdownMenuContent
            className="w-xs overflow-hidden md:w-lg"
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
