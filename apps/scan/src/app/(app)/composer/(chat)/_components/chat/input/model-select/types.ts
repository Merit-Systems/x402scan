import type { ProviderMetadata } from 'ai';

export enum LanguageModelCapability {
  Vision = 'vision',
  Reasoning = 'reasoning',
  Pdf = 'pdf',
  ToolCalling = 'tool-calling',
}

export interface LanguageModel {
  name: string;
  provider: string;
  modelId: string;
  description?: string;
  capabilities?: LanguageModelCapability[];
  bestFor?: string[];
  contextLength?: number;
  isNew?: boolean;
  providerOptions?: ProviderMetadata;
}
