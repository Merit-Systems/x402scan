import { describe, expect, it } from 'vitest';

import {
  originResourcesQuerySchema,
  registryOriginQuerySchema,
  resourcesListQuerySchema,
} from './schemas';

// The `chain` filter of the resource listing endpoints takes the listed
// chains, like the `chains` filter of resources-search.
describe.each([
  ['resources', resourcesListQuerySchema, {}],
  ['origin-resources', originResourcesQuerySchema, {}],
  [
    'registry-origin',
    registryOriginQuerySchema,
    { url: 'https://api.priors.trade' },
  ],
])('%s query', (_handler, schema, requiredParams) => {
  it('accepts robinhood as chain and still refuses chains that are not listed', () => {
    for (const chain of ['base', 'solana', 'robinhood']) {
      expect(schema.safeParse({ ...requiredParams, chain }).data?.chain).toBe(
        chain
      );
    }
    for (const chain of ['polygon', 'ethereum']) {
      expect(schema.safeParse({ ...requiredParams, chain }).success).toBe(
        false
      );
    }
  });
});
