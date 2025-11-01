import { LanguageModelCapability, type LanguageModel } from '../types';

const anthropicModelData: Omit<LanguageModel, 'provider'>[] = [
  // Non-reasoning first
  {
    name: 'Claude Sonnet 4.5',
    modelId: 'claude-sonnet-4.5',
    description:
      'Most advanced Sonnet; optimized for agents and coding with sustained autonomous operation.',
    capabilities: [
      LanguageModelCapability.Vision,
      LanguageModelCapability.Reasoning,
      LanguageModelCapability.Pdf,
      LanguageModelCapability.ToolCalling,
    ],
    bestFor: ['Agents', 'Coding workflows', 'Long-running tasks'],
    contextLength: 1000000,
    isNew: true,
  },
  {
    name: 'Claude 3.5 Haiku',
    modelId: 'claude-3.5-haiku',
    description:
      'Fast for interactive tasks; strong coding accuracy and tool use.',
    capabilities: [
      LanguageModelCapability.Vision,
      LanguageModelCapability.Pdf,
      LanguageModelCapability.ToolCalling,
    ],
    bestFor: ['Quick responses', 'Simple queries', 'Real-time chat'],
    contextLength: 200000,
  },
  // Reasoning models after
  {
    name: 'Claude Haiku 4.5',
    modelId: 'claude-haiku-4.5',
    description:
      "Anthropic's fastest and most efficient model; near-frontier capability for real-time, high-volume apps.",
    capabilities: [
      LanguageModelCapability.Vision,
      LanguageModelCapability.Reasoning,
      LanguageModelCapability.Pdf,
      LanguageModelCapability.ToolCalling,
    ],
    bestFor: ['Real-time apps', 'High-volume workloads', 'Sub-agents & tools'],
    contextLength: 200000,
    isNew: true,
  },
  {
    name: 'Claude Opus 4.1',
    modelId: 'claude-opus-4.1',
    description:
      'Updated flagship with improved coding, reasoning, and agentic performance.',
    capabilities: [
      LanguageModelCapability.Vision,
      LanguageModelCapability.Reasoning,
      LanguageModelCapability.Pdf,
      LanguageModelCapability.ToolCalling,
    ],
    bestFor: ['Complex coding', 'Research', 'Tool-assisted reasoning'],
    contextLength: 200000,
    isNew: true,
  },
  {
    name: 'Claude Opus 4',
    modelId: 'claude-opus-4',
    description:
      'Flagship model for complex, long-running, agentic workflows and deep reasoning.',
    capabilities: [
      LanguageModelCapability.Vision,
      LanguageModelCapability.Reasoning,
      LanguageModelCapability.Pdf,
      LanguageModelCapability.ToolCalling,
    ],
    bestFor: ['Complex analysis', 'Creative writing', 'Research'],
    contextLength: 200000,
  },
  {
    name: 'Claude Sonnet 4',
    modelId: 'claude-sonnet-4',
    description:
      'Balanced performance with strong coding and reasoning; everyday reliability.',
    capabilities: [
      LanguageModelCapability.Vision,
      LanguageModelCapability.Reasoning,
      LanguageModelCapability.Pdf,
      LanguageModelCapability.ToolCalling,
    ],
    bestFor: ['General purpose', 'Code generation', 'Analysis'],
    contextLength: 1000000,
  },
  {
    name: 'Claude 3.7 Sonnet',
    modelId: 'claude-3.7-sonnet',
    description:
      'Improved reasoning and coding with hybrid reasoning; strong for agentic workflows.',
    capabilities: [
      LanguageModelCapability.Vision,
      LanguageModelCapability.Reasoning,
      LanguageModelCapability.Pdf,
      LanguageModelCapability.ToolCalling,
    ],
    bestFor: ['Code review', 'Content creation', 'Problem solving'],
    contextLength: 200000,
  },
  {
    name: 'Claude 3.5 Sonnet',
    modelId: 'claude-3.5-sonnet',
    description:
      'Balanced capability and speed; strong visual processing and agentic tool use.',
    capabilities: [
      LanguageModelCapability.Vision,
      LanguageModelCapability.Reasoning,
      LanguageModelCapability.Pdf,
      LanguageModelCapability.ToolCalling,
    ],
    bestFor: ['General purpose', 'Code assistance', 'Writing'],
    contextLength: 200000,
  },
] as const;

export const anthropicModels: LanguageModel[] = anthropicModelData.map(
  model => ({
    ...model,
    provider: 'anthropic',
  })
);
