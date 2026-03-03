import { beforeEach, describe, expect, it, vi } from 'vitest';

const validV1Response = {
  x402Version: 1,
  accepts: [
    {
      scheme: 'exact',
      network: 'base',
      maxAmountRequired: '1000',
      resource: 'https://example.com/tool',
      description: 'A valid test resource',
      mimeType: 'application/json',
      payTo: '0x1234567890123456789012345678901234567890',
      maxTimeoutSeconds: 60,
      asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      outputSchema: {
        input: {
          type: 'http',
          method: 'GET',
        },
      },
    },
  ],
};

const validV2WithoutSchema = {
  x402Version: 2,
  accepts: [
    {
      scheme: 'exact',
      network: 'eip155:8453',
      amount: '1000',
      payTo: '0x1234567890123456789012345678901234567890',
      maxTimeoutSeconds: 60,
      asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      extra: {},
    },
  ],
  resource: {
    url: 'https://example.com/tool',
    description: 'A valid v2 resource',
    mimeType: 'application/json',
  },
};

async function loadValidateWithDiscoveryMock(
  validatePaymentRequiredDetailed?: (payload: unknown) => {
    valid: boolean;
    issues: unknown[];
  }
) {
  vi.resetModules();
  vi.doMock('@agentcash/discovery', () => ({
    validatePaymentRequiredDetailed,
  }));
  return import('./validate');
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('validateX402', () => {
  it('falls back cleanly when discovery detailed validation is unavailable', async () => {
    const { validateX402 } = await loadValidateWithDiscoveryMock(undefined);
    const result = validateX402(validV1Response);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.issues).toEqual([]);
    }
  });

  it('surfaces discovery chain/network errors in legacy parseErrors', async () => {
    const { validateX402 } = await loadValidateWithDiscoveryMock(() => ({
      valid: false,
      issues: [
        {
          code: 'CHAIN_UNSUPPORTED',
          severity: 'error',
          path: '$.accepts[0].network',
          message:
            'Unsupported chain identifier "solana-mainnet-beta". Use "solana".',
        },
      ],
    }));

    const result = validateX402({
      ...validV1Response,
      accepts: [
        {
          ...validV1Response.accepts[0],
          network: 'solana-mainnet-beta',
        },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues).toHaveLength(1);
      expect(result.errors).toContain(
        'CHAIN_UNSUPPORTED: $.accepts[0].network: Unsupported chain identifier "solana-mainnet-beta". Use "solana".'
      );
    }
  });

  it('preserves warnings while allowing valid payloads to pass', async () => {
    const { validateX402 } = await loadValidateWithDiscoveryMock(() => ({
      valid: true,
      issues: [
        {
          code: 'METADATA_FAVICON_MISSING',
          severity: 'warn',
          path: '$.resource',
          message: 'Origin metadata is missing favicon.',
        },
      ],
    }));

    const result = validateX402(validV1Response);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.issues).toEqual([
        {
          code: 'METADATA_FAVICON_MISSING',
          severity: 'warn',
          path: '$.resource',
          message: 'Origin metadata is missing favicon.',
        },
      ]);
    }
  });

  it('fails strict validation when discovery marks payload invalid with warn-only issues', async () => {
    const { validateX402 } = await loadValidateWithDiscoveryMock(() => ({
      valid: false,
      issues: [
        {
          code: 'COMPAT_ESCALATED_STRICT',
          severity: 'warn',
          path: '$.resource',
          message: 'Compatibility issue escalated by strict mode.',
        },
      ],
    }));

    const result = validateX402(validV1Response);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues).toEqual([
        {
          code: 'COMPAT_ESCALATED_STRICT',
          severity: 'warn',
          path: '$.resource',
          message: 'Compatibility issue escalated by strict mode.',
        },
      ]);
    }
  });

  it('still returns missing input schema when payload has no discoverable schema', async () => {
    const { validateX402 } = await loadValidateWithDiscoveryMock(() => ({
      valid: true,
      issues: [],
    }));

    const result = validateX402(validV2WithoutSchema);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toContain('Missing input schema');
    }
  });
});
