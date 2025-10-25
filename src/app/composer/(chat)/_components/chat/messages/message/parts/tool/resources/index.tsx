import { aibeatsComponents } from './aibeats';
import { echoComponents } from './echo';
import { firecrawlComponents } from './firecrawl';
import { freepikComponents } from './freepik';

import type { ResourceComponentMap } from './types';

export const resourceComponents: ResourceComponentMap = {
  ['https://api.firecrawl.dev/v1/x402/search']: firecrawlComponents,
  ['https://api.firecrawl.dev/v2/x402/search']: firecrawlComponents,
  ['https://api.freepik.com/v1/x402/ai/mystic']: freepikComponents,
  ['https://www.aibeats.fun/api/x402/music/generate']: aibeatsComponents,
  ...echoComponents,
};
