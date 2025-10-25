import { anthropicModels } from './anthropic';
import { googleModels } from './google';
import { openAiLanguageModels } from './openai';
import { xaiLanguageModels } from './xai';
import { llamaModels } from './llama';
import { deepseekModels } from './deepseek';

export const languageModels = [
  ...anthropicModels,
  ...googleModels,
  ...openAiLanguageModels,
  ...xaiLanguageModels,
  ...llamaModels,
  ...deepseekModels,
];
