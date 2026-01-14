import { describe, it, expect } from 'vitest';
import {
  toCaip2,
  getChainConfig,
  getChainId,
  getChainName,
  getUSDCAddress,
  isTestnet,
  DEFAULT_NETWORK,
} from '../src/server/lib/networks';

describe('toCaip2', () => {
  it('returns CAIP-2 format unchanged', () => {
    expect(toCaip2('eip155:8453')).toBe('eip155:8453');
    expect(toCaip2('eip155:1')).toBe('eip155:1');
  });

  it('converts v1 names to CAIP-2', () => {
    expect(toCaip2('base')).toBe('eip155:8453');
    expect(toCaip2('base-sepolia')).toBe('eip155:84532');
    expect(toCaip2('ethereum')).toBe('eip155:1');
    expect(toCaip2('optimism')).toBe('eip155:10');
    expect(toCaip2('arbitrum')).toBe('eip155:42161');
    expect(toCaip2('polygon')).toBe('eip155:137');
  });

  it('is case-insensitive for v1 names', () => {
    expect(toCaip2('BASE')).toBe('eip155:8453');
    expect(toCaip2('Base')).toBe('eip155:8453');
  });

  it('returns unknown input unchanged', () => {
    expect(toCaip2('unknown')).toBe('unknown');
  });
});

describe('getChainConfig', () => {
  it('returns config for CAIP-2 identifier', () => {
    const config = getChainConfig('eip155:8453');
    expect(config).toBeDefined();
    expect(config?.v1Name).toBe('base');
    expect(config?.chain.name).toBe('Base');
  });

  it('returns config for v1 name', () => {
    const config = getChainConfig('base');
    expect(config).toBeDefined();
    expect(config?.caip2).toBe('eip155:8453');
  });

  it('returns undefined for unknown network', () => {
    expect(getChainConfig('unknown')).toBeUndefined();
  });
});

describe('getChainId', () => {
  it('extracts chain ID from CAIP-2', () => {
    expect(getChainId('eip155:8453')).toBe(8453);
    expect(getChainId('eip155:1')).toBe(1);
    expect(getChainId('eip155:84532')).toBe(84532);
  });

  it('converts v1 name and extracts chain ID', () => {
    expect(getChainId('base')).toBe(8453);
    expect(getChainId('ethereum')).toBe(1);
  });

  it('returns undefined for invalid format', () => {
    expect(getChainId('invalid')).toBeUndefined();
  });
});

describe('getChainName', () => {
  it('returns human-readable name', () => {
    expect(getChainName('eip155:8453')).toBe('Base');
    expect(getChainName('eip155:1')).toBe('Ethereum');
    expect(getChainName('base-sepolia')).toBe('Base Sepolia');
  });

  it('returns input for unknown network', () => {
    expect(getChainName('unknown')).toBe('unknown');
  });
});

describe('getUSDCAddress', () => {
  it('returns USDC address for known networks', () => {
    expect(getUSDCAddress('eip155:8453')).toBe(
      '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
    );
    expect(getUSDCAddress('eip155:1')).toBe(
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
    );
  });

  it('returns undefined for unknown network', () => {
    expect(getUSDCAddress('unknown')).toBeUndefined();
  });
});

describe('isTestnet', () => {
  it('returns true for testnets', () => {
    expect(isTestnet('base-sepolia')).toBe(true);
    expect(isTestnet('eip155:84532')).toBe(true);
    expect(isTestnet('ethereum-sepolia')).toBe(true);
  });

  it('returns false for mainnets', () => {
    expect(isTestnet('base')).toBe(false);
    expect(isTestnet('eip155:8453')).toBe(false);
    expect(isTestnet('ethereum')).toBe(false);
  });

  it('returns false for unknown network', () => {
    expect(isTestnet('unknown')).toBe(false);
  });
});

describe('DEFAULT_NETWORK', () => {
  it('is Base mainnet', () => {
    expect(DEFAULT_NETWORK).toBe('eip155:8453');
  });
});
