import { registerGettingStartedPrompt } from './getting-started';
import { registerEnrichPrompt } from './enrich';
import type { RegisterPrompts } from './types';

export const registerPrompts: RegisterPrompts = props => {
  registerGettingStartedPrompt(props);
  registerEnrichPrompt(props);
};
