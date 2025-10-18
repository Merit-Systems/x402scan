import { ecosystemItems } from './list';
import { defaultEcosystemItems } from './default';

// NOTE(shafu): ecosystemItems come from `x402.org/ecosystem`, while
// defaultEcosystemItems are defined here in the repo.
export const EcosystemItems = [...ecosystemItems, ...defaultEcosystemItems];
