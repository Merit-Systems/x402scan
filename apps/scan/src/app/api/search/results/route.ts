import { proxyAgentCashSearchGet } from '../_lib/agentcash-search-proxy';

const searchResultParams = ['q', 'broad', 'limit'] as const;

export function GET(request: Request) {
  return proxyAgentCashSearchGet({
    allowedParams: searchResultParams,
    path: '/api/external/search/results',
    request,
  });
}
