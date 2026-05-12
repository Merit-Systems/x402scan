import { describe, expect, it } from 'vitest';

import { registryRegisterBodySchema } from './schemas';

describe('registryRegisterBodySchema', () => {
  it('accepts programmatic probe options for resource registration', () => {
    const result = registryRegisterBodySchema.safeParse({
      url: 'https://api.example.com/paid-resource',
      method: 'POST',
      headers: { Authorization: 'Bearer token' },
      body: { prompt: 'hello' },
    });

    expect(result.success).toBe(true);
  });

  it('rejects non-string header values', () => {
    const result = registryRegisterBodySchema.safeParse({
      url: 'https://api.example.com/paid-resource',
      headers: { 'X-Retry': 3 },
    });

    expect(result.success).toBe(false);
  });
});
