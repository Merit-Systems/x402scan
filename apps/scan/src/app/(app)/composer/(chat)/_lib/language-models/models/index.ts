import { anthropicModels } from "./anthropic";
import { deepseekModels } from "./deepseek";
import { googleModels } from "./google";
import { llamaModels } from "./llama";
import { openAiLanguageModels } from "./openai";
import { xaiLanguageModels } from "./xai";

export const languageModels = [
  ...anthropicModels,
  ...googleModels,
  ...openAiLanguageModels,
  ...xaiLanguageModels,
  ...llamaModels,
  ...deepseekModels,
];
