/**
 * Display description for a discovered endpoint. The discovery package folds
 * the openapi operation's `summary ?? description` into `summary`, defaulting
 * to a "METHOD /path" placeholder when the merchant set neither — meaningless
 * next to the route itself, so it's dropped.
 */
export function endpointDescription(endpoint: {
  method: string;
  path: string;
  summary?: string;
}): string | undefined {
  if (!endpoint.summary) return undefined;
  return endpoint.summary === `${endpoint.method} ${endpoint.path}`
    ? undefined
    : endpoint.summary;
}
