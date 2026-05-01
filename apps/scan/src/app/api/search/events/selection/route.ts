import { proxyAgentCashSearchPost } from '../../_lib/agentcash-search-proxy';

export function POST(request: Request) {
  return proxyAgentCashSearchPost({
    path: '/api/external/search/events/selection',
    request,
  });
}
