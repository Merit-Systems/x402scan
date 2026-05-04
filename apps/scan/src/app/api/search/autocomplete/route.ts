import { proxyAgentCashSearchGet } from '../_lib/agentcash-search-proxy';

const autocompleteParams = ['q', 'suggestions', 'results'] as const;

export function GET(request: Request) {
  return proxyAgentCashSearchGet({
    allowedParams: autocompleteParams,
    path: '/api/external/search/autocomplete',
    request,
  });
}
