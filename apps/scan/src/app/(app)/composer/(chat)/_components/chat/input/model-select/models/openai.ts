import { LanguageModelCapability, type LanguageModel } from '../types';

const openAiLanguageModelsData: Omit<LanguageModel, 'provider'>[] = [
  {
    name: 'GPT-5 Chat',
    modelId: 'gpt-5-chat',
    description:
      'Advanced, natural, multimodal, and context-aware conversations for enterprise.',
    capabilities: [
      LanguageModelCapability.ToolCalling,
      LanguageModelCapability.Vision,
      LanguageModelCapability.Pdf,
    ],
    bestFor: ['Enterprise chat', 'Context-aware assistants'],
    contextLength: 128000,
  },
  {
    name: 'GPT-5 Nano',
    modelId: 'gpt-5-nano',
    description:
      'Smallest and fastest GPT-5 variant for ultra-low latency interactions.',
    capabilities: [LanguageModelCapability.ToolCalling],
    bestFor: ['Developer tools', 'Realtime UX'],
    contextLength: 400000,
  },
  {
    name: 'GPT-5',
    modelId: 'gpt-5',
    description:
      'Advanced model optimized for step-by-step reasoning and instruction following.',
    capabilities: [
      LanguageModelCapability.Reasoning,
      LanguageModelCapability.ToolCalling,
      LanguageModelCapability.Pdf,
      LanguageModelCapability.Vision,
    ],
    bestFor: ['Complex reasoning', 'High fidelity outputs'],
    contextLength: 400000,
  },
  {
    name: 'GPT-5 Mini',
    modelId: 'gpt-5-mini',
    description:
      'Compact GPT-5 for lower-latency reasoning with strong instruction following.',
    capabilities: [
      LanguageModelCapability.ToolCalling,
      LanguageModelCapability.Reasoning,
      LanguageModelCapability.Pdf,
      LanguageModelCapability.Vision,
    ],
    bestFor: ['Interactive apps', 'Cost efficiency'],
    contextLength: 400000,
  },
  // Reasoning-focused and deep-research variants pushed to bottom
  {
    name: 'o3 Deep Research',
    modelId: 'o3-deep-research',
    description:
      'Advanced deep-research model; always uses web search tools (additional cost).',
    capabilities: [
      LanguageModelCapability.ToolCalling,
      LanguageModelCapability.Reasoning,
      LanguageModelCapability.Pdf,
      LanguageModelCapability.Vision,
    ],
    bestFor: ['Deep research', 'Multi-step tasks'],
    contextLength: 200000,
    isNew: true,
  },
  {
    name: 'o4 Mini Deep Research',
    modelId: 'o4-mini-deep-research',
    description:
      'Faster, more affordable deep research with built-in web search tooling.',
    capabilities: [
      LanguageModelCapability.ToolCalling,
      LanguageModelCapability.Reasoning,
    ],
    bestFor: ['Research', 'Complex queries at speed'],
    contextLength: 200000,
    isNew: true,
  },
  {
    name: 'GPT-5 Pro',
    modelId: 'gpt-5-pro',
    description:
      'Most advanced model for step-by-step reasoning and high-stakes accuracy.',
    capabilities: [
      LanguageModelCapability.Reasoning,
      LanguageModelCapability.ToolCalling,
      LanguageModelCapability.Pdf,
      LanguageModelCapability.Vision,
    ],
    bestFor: ['Complex tasks', 'Safety-critical use cases'],
    contextLength: 400000,
    isNew: true,
  },
  {
    name: 'GPT-5 Codex',
    modelId: 'gpt-5-codex',
    description:
      'Specialized for software engineering: coding, refactors, reviews, and agents.',
    capabilities: [
      LanguageModelCapability.ToolCalling,
      LanguageModelCapability.Reasoning,
      LanguageModelCapability.Vision,
      LanguageModelCapability.Pdf,
    ],
    bestFor: ['Coding agents', 'Refactoring', 'Code reviews'],
    contextLength: 400000,
    isNew: true,
  },
  {
    name: 'O3',
    modelId: 'o3',
    description:
      'Well-rounded powerful model for math, science, coding, and writing.',
    capabilities: [
      LanguageModelCapability.ToolCalling,
      LanguageModelCapability.Reasoning,
      LanguageModelCapability.Pdf,
      LanguageModelCapability.Vision,
    ],
    bestFor: ['Complex reasoning', 'Research', 'Advanced analysis'],
    contextLength: 200000,
  },
  {
    name: 'O4 Mini',
    modelId: 'o4-mini',
    description:
      'Compact reasoning model optimized for fast, cost-efficient performance.',
    capabilities: [
      LanguageModelCapability.Reasoning,
      LanguageModelCapability.Pdf,
      LanguageModelCapability.Vision,
      LanguageModelCapability.ToolCalling,
    ],
    bestFor: ['High-throughput', 'Cost-sensitive reasoning'],
    contextLength: 200000,
  },
  {
    name: 'GPT-4.1',
    modelId: 'gpt-4.1',
    description:
      'Flagship LLM optimized for instruction following and long-context reasoning.',
    capabilities: [
      LanguageModelCapability.Vision,
      LanguageModelCapability.Pdf,
      LanguageModelCapability.ToolCalling,
    ],
    bestFor: ['Agents', 'IDE tooling', 'Long documents'],
    contextLength: 1000000,
  },
  {
    name: 'GPT-4.1 Mini',
    modelId: 'gpt-4.1-mini',
    description:
      'Mid-sized model with competitive performance at lower latency and cost.',
    capabilities: [
      LanguageModelCapability.Vision,
      LanguageModelCapability.Pdf,
      LanguageModelCapability.ToolCalling,
    ],
    bestFor: ['Interactive apps', 'Balanced performance'],
    contextLength: 1000000,
  },
  {
    name: 'GPT-4.1 Nano',
    modelId: 'gpt-4.1-nano',
    description: 'Fastest and cheapest GPT-4.1 variant for low-latency tasks.',
    capabilities: [
      LanguageModelCapability.Vision,
      LanguageModelCapability.Pdf,
      LanguageModelCapability.ToolCalling,
    ],
    bestFor: ['Classification', 'Autocomplete', 'Realtime UX'],
    contextLength: 1000000,
  },
  {
    name: 'GPT-4o',
    modelId: 'gpt-4o',
    description:
      'Advanced multimodal model with vision and reasoning for diverse tasks.',
    capabilities: [
      LanguageModelCapability.Vision,
      LanguageModelCapability.Pdf,
      LanguageModelCapability.ToolCalling,
    ],
    bestFor: ['Multimodal tasks', 'Vision analysis', 'Code generation'],
    contextLength: 128000,
  },
  {
    name: 'GPT-4o Mini',
    modelId: 'gpt-4o-mini',
    description: 'Smaller, faster version of GPT-4o.',
    capabilities: [
      LanguageModelCapability.Vision,
      LanguageModelCapability.Pdf,
      LanguageModelCapability.ToolCalling,
    ],
    bestFor: ['Quick tasks', 'Cost-effective', 'Simple queries'],
    contextLength: 128000,
  },
];

export const openAiLanguageModels: LanguageModel[] =
  openAiLanguageModelsData.map(model => ({
    ...model,
    provider: 'openai',
  }));
