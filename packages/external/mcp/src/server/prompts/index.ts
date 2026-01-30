import { registerGettingStartedPrompt } from './getting-started';
import { registerEnrichPrompt } from './enrich';

import type { RegisterPrompts } from '../types';

export const registerPrompts: RegisterPrompts = async props => {
  await Promise.all([
    registerGettingStartedPrompt(props),
    registerEnrichPrompt(props),
  ]);
};
