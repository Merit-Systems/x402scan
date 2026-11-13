import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createCallerFactory } from '../trpc';
import { developerRouter } from './developer';
import { probeX402Endpoint } from '@/lib/discovery/probe';
import { validateResource } from '@/lib/resources';
import { fetchDiscoveryDocument } from '@/services/discovery';
import {
  cacheProbeResult,
  createProbeSession,
} from '@/lib/discovery/probe-cache';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/env', () => ({
  env: { HIDE_TRPC_LOGS: true, CRON_SECRET: 'test-cron-secret' },
}));

vi.mock('@/services/scraper', () => ({
  scrapeOriginData: vi.fn(),
}));

vi.mock('@/lib/discovery/probe', () => ({
  probeX402Endpoint: vi.fn(),
}));

vi.mock('@/lib/resources', () => ({
  validateResource: vi.fn(),
}));

vi.mock('@/services/discovery', () => ({
  fetchDiscoveryDocument: vi.fn(),
}));

vi.mock('@/lib/discovery/probe-cache', () => ({
  createProbeSession: vi.fn(),
  cacheProbeResult: vi.fn(),
}));

vi.mock('@/lib/discovery/server-host-mismatch', () => ({
  detectServerHostMismatch: vi.fn(),
}));

vi.mock('@/lib/discovery/favicon-blocked', () => ({
  detectBlockedFavicon: vi.fn(),
}));

const createCaller = createCallerFactory(developerRouter);
const caller = () =>
  createCaller({
    headers: new Headers(),
    session: null,
    isWarmingCache: false,
  });

const URL = 'https://merchant.example/v1/paid';
const TRUSTED_SCHEMA = {
  anyOf: [{ required: ['symbols'] }, { required: ['contracts'] }],
};

describe('developer.batchTest trusted operation metadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createProbeSession).mockReturnValue(
      '00000000-0000-4000-8000-000000000001'
    );
    vi.mocked(cacheProbeResult).mockResolvedValue(undefined);
    vi.mocked(validateResource).mockReturnValue({
      valid: true,
      warnings: [],
    } as never);
    vi.mocked(probeX402Endpoint).mockResolvedValue({
      success: true,
      advisory: {
        method: 'GET',
        inputSchema: {},
      } as never,
      warnings: [],
    });
  });

  it('uses server-side trusted query metadata and ignores client-forged metadata', async () => {
    vi.mocked(fetchDiscoveryDocument).mockResolvedValue({
      success: true,
      source: 'openapi',
      resources: [
        {
          url: URL,
          method: 'GET',
          authMode: 'paid',
          queryParametersSchema: TRUSTED_SCHEMA,
        },
      ],
    });

    const result = await caller().batchTest({
      resources: [
        {
          url: URL,
          method: 'GET',
          authMode: 'paid',
          queryParametersSchema: {
            anyOf: [{ required: ['attacker'] }],
          },
        } as never,
      ],
    });

    expect(fetchDiscoveryDocument).toHaveBeenCalledWith(
      'https://merchant.example',
      false,
      true
    );
    expect(probeX402Endpoint).toHaveBeenCalledWith(
      URL,
      'GET',
      undefined,
      TRUSTED_SCHEMA
    );
    expect(result.resources).toHaveLength(1);
  });

  it('does not probe an endpoint excluded by trusted OpenAPI metadata', async () => {
    vi.mocked(fetchDiscoveryDocument).mockResolvedValue({
      success: true,
      source: 'openapi',
      resources: [
        {
          url: URL,
          method: 'GET',
          authMode: 'paid',
          registryEligible: false,
        },
      ],
    });

    const result = await caller().batchTest({
      resources: [{ url: URL, method: 'GET', authMode: 'paid' }],
    });

    expect(fetchDiscoveryDocument).toHaveBeenCalledWith(
      'https://merchant.example',
      false,
      true
    );
    expect(probeX402Endpoint).not.toHaveBeenCalled();
    expect(result.resources).toEqual([]);
    expect(result.failed).toEqual([]);
  });
});
