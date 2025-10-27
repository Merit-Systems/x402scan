import { LanguageModelCapability, type LanguageModel } from '../types';

const googleModelData: Omit<LanguageModel, 'provider'>[] = [
  // Non-reasoning or general-purpose first
  {
    name: 'Gemini 2.5 Flash',
    modelId: 'gemini-2.5-flash',
    description:
      'Workhorse model for advanced tasks including coding and scientific analysis.',
    capabilities: [
      LanguageModelCapability.Vision,
      LanguageModelCapability.Pdf,
      LanguageModelCapability.ToolCalling,
      LanguageModelCapability.Reasoning,
    ],
    bestFor: ['Coding', 'Scientific analysis', 'General tasks'],
    contextLength: 1050000,
  },
  // Reasoning-focused variants to bottom
  {
    name: 'Gemini 2.5 Flash Preview 09-2025',
    modelId: 'gemini-2.5-flash-preview-09-2025',
    description:
      'Workhorse model for reasoning, coding, math, and science with thinking.',
    capabilities: [
      LanguageModelCapability.Vision,
      LanguageModelCapability.Reasoning,
      LanguageModelCapability.Pdf,
      LanguageModelCapability.ToolCalling,
    ],
    bestFor: ['Advanced reasoning', 'Coding', 'Scientific tasks'],
    contextLength: 1050000,
    isNew: true,
  },
  {
    name: 'Gemini 2.5 Flash Lite Preview 09-2025',
    modelId: 'gemini-2.5-flash-lite-preview-09-2025',
    description:
      'Lightweight reasoning model optimized for ultra-low latency and cost.',
    capabilities: [
      LanguageModelCapability.Reasoning,
      LanguageModelCapability.ToolCalling,
      LanguageModelCapability.Vision,
      LanguageModelCapability.Pdf,
    ],
    bestFor: ['Throughput', 'Quick responses', 'Cost-efficient tasks'],
    contextLength: 1050000,
    isNew: true,
  },
  {
    name: 'Gemini 2.5 Flash Lite',
    modelId: 'gemini-2.5-flash-lite',
    description:
      'Lightweight model with improved throughput and faster generation.',
    capabilities: [
      LanguageModelCapability.Reasoning,
      LanguageModelCapability.ToolCalling,
    ],
    bestFor: ['Low-latency apps', 'Cost-efficient workloads'],
    contextLength: 1050000,
  },
  {
    name: 'Gemini 2.5 Flash Lite Preview 06-17',
    modelId: 'gemini-2.5-flash-lite-preview-06-17',
    description:
      'Preview of Flash-Lite with improved throughput and low-latency focus.',
    capabilities: [
      LanguageModelCapability.Reasoning,
      LanguageModelCapability.ToolCalling,
      LanguageModelCapability.Vision,
      LanguageModelCapability.Pdf,
    ],
    bestFor: ['Throughput', 'Quick tasks', 'Cost efficiency'],
    contextLength: 1050000,
  },
  {
    name: 'Gemini 2.5 Pro',
    modelId: 'gemini-2.5-pro',
    description: 'Next-generation Gemini with enhanced reasoning capabilities.',
    capabilities: [
      LanguageModelCapability.Vision,
      LanguageModelCapability.Reasoning,
      LanguageModelCapability.Pdf,
      LanguageModelCapability.ToolCalling,
    ],
    bestFor: ['Complex reasoning', 'Research', 'Enterprise workloads'],
    contextLength: 2000000,
  },
];

export const googleModels: LanguageModel[] = googleModelData.map(model => ({
  ...model,
  provider: 'google',
}));
