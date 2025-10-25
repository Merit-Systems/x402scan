import { LanguageModelCapability, type LanguageModel } from '../types';

const xaiLanguageModelData: Omit<LanguageModel, 'provider'>[] = [
  // Non-reasoning or general-purpose first (least reasoning emphasis)
  {
    name: 'Grok 4 Fast',
    modelId: 'grok-4-fast',
    description:
      "xAI's latest multimodal model with SOTA cost-efficiency and 2M context.",
    capabilities: [
      LanguageModelCapability.ToolCalling,
      LanguageModelCapability.Vision,
      LanguageModelCapability.Reasoning,
    ],
    bestFor: ['Throughput', 'Low-latency multimodal'],
    contextLength: 2000000,
    isNew: true,
  },
  // Reasoning-focused variants to bottom
  {
    name: 'Grok Code Fast 1',
    modelId: 'grok-code-fast-1',
    description:
      'Speedy, economical reasoning model that excels at agentic coding.',
    capabilities: [
      LanguageModelCapability.ToolCalling,
      LanguageModelCapability.Reasoning,
    ],
    bestFor: ['Agentic coding', 'Developer workflows'],
    contextLength: 256000,
    isNew: true,
  },
  {
    name: 'Grok 4',
    modelId: 'grok-4',
    description:
      'Latest reasoning model with 256k context; parallel tools and structured outputs.',
    capabilities: [
      LanguageModelCapability.ToolCalling,
      LanguageModelCapability.Vision,
      LanguageModelCapability.Reasoning,
    ],
    bestFor: ['Reasoning', 'Tool use', 'Multimodal inputs'],
    contextLength: 256000,
  },
  {
    name: 'Grok 3 Mini',
    modelId: 'grok-3-mini',
    description:
      'Lightweight model that thinks before responding; reasoning traces visible.',
    capabilities: [
      LanguageModelCapability.ToolCalling,
      LanguageModelCapability.Reasoning,
    ],
    bestFor: ['Logic tasks', 'Cost efficiency'],
    contextLength: 131000,
  },
  {
    name: 'Grok 3',
    modelId: 'grok-3',
    description:
      'Flagship model for enterprise use cases like data extraction and coding.',
    capabilities: [
      LanguageModelCapability.ToolCalling,
      LanguageModelCapability.Reasoning,
    ],
    bestFor: ['Coding', 'Summarization', 'Structured tasks'],
    contextLength: 131000,
  },
  {
    name: 'Grok 3 Mini Beta',
    modelId: 'grok-3-mini-beta',
    description:
      'Smaller thinking model; transparent traces; adjustable reasoning effort.',
    capabilities: [
      LanguageModelCapability.ToolCalling,
      LanguageModelCapability.Reasoning,
    ],
    bestFor: ['Math & quantitative tasks', 'Reasoning under budget'],
    contextLength: 131000,
  },
  {
    name: 'Grok 3 Beta',
    modelId: 'grok-3-beta',
    description:
      'Flagship beta with strong performance on GPQA, LCB, and MMLU-Pro.',
    capabilities: [
      LanguageModelCapability.ToolCalling,
      LanguageModelCapability.Reasoning,
    ],
    bestFor: ['Enterprise tasks', 'Structured outputs'],
    contextLength: 131000,
  },
];

export const xaiLanguageModels: LanguageModel[] = xaiLanguageModelData.map(
  model => ({
    ...model,
    provider: 'x-ai',
  })
);
