'use client';

import { Eye, Sparkles, File, Wrench } from 'lucide-react';

import { LanguageModelCapability } from './types';

export const capabilityIcons: Record<
  LanguageModelCapability,
  React.ComponentType<{ className?: string }>
> = {
  [LanguageModelCapability.Vision]: Eye,
  [LanguageModelCapability.Reasoning]: Sparkles,
  [LanguageModelCapability.Pdf]: File,
  [LanguageModelCapability.ToolCalling]: Wrench,
};

export const capabilityColors: Record<LanguageModelCapability, string> = {
  [LanguageModelCapability.Vision]: 'bg-green-100 text-green-800',
  [LanguageModelCapability.Reasoning]: 'bg-orange-100 text-orange-800',
  [LanguageModelCapability.Pdf]: 'bg-gray-200 text-gray-800',
  [LanguageModelCapability.ToolCalling]: 'bg-yellow-100 text-yellow-800',
};

export const modelProviderNames: Record<string, string> = {
  openai: 'OpenAI',
  google: 'Google',
  anthropic: 'Anthropic',
  perplexity: 'Perplexity',
  'x-ai': 'xAI',
  'meta-llama': 'Llama',
  qwen: 'Qwen',
  deepseek: 'DeepSeek',
  fireworks: 'Fireworks AI',
  azure: 'Azure (DALL-E)',
  vertex: 'Google Vertex AI',
  xai: 'xAI',
  openrouter: 'OpenRouter',
};
