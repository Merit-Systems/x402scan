/** External origins control this text — cap what we persist per resource. */
const MAX_DESCRIPTION_LENGTH = 500;

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
  if (endpoint.summary === `${endpoint.method} ${endpoint.path}`) {
    return undefined;
  }
  return endpoint.summary.slice(0, MAX_DESCRIPTION_LENGTH);
}
