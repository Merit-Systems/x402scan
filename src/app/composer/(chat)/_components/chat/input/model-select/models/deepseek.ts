import { type LanguageModel, LanguageModelCapability } from '../types';

const deepseekModelData: Omit<LanguageModel, 'provider'>[] = [
  {
    name: 'DeepSeek-V3.2-Exp',
    modelId: 'deepseek-v3.2-exp',
    description:
      'Experimental LLM with DeepSeek Sparse Attention for efficient long-context reasoning, coding, and tool use; research-oriented, 131K context.',
    capabilities: [
      LanguageModelCapability.ToolCalling,
      LanguageModelCapability.Reasoning,
    ],
    bestFor: [
      'Research tasks',
      'Long-context reasoning',
      'Coding',
      'Agentic tool use',
    ],
    contextLength: 131072,
  },
];

export const deepseekModels: LanguageModel[] = deepseekModelData.map(model => ({
  ...model,
  provider: 'deepseek',
}));
