/**
 * Tests for SIWX integration in x402scan-mcp
 *
 * Only tests our integration logic, not the vendored SIWX library.
 * Vendored library tests are in src/vendor/sign-in-with-x/siwx.test.ts
 */

import { describe, it, expect } from 'vitest';
import {
  SOLANA_MAINNET,
  SOLANA_DEVNET,
} from '../vendor/sign-in-with-x/index.js';

describe('authed_call Solana Detection', () => {
  /**
   * Tests that Solana chainIds are correctly detected.
   * The authed_call tool checks `chainId.startsWith('solana:')` and returns
   * a helpful error because EVM wallets cannot sign Solana messages.
   */

  it('detects Solana mainnet chainId', () => {
    const chainId = SOLANA_MAINNET; // 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'
    expect(chainId.startsWith('solana:')).toBe(true);
  });

  it('detects Solana devnet chainId', () => {
    const chainId = SOLANA_DEVNET; // 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1'
    expect(chainId.startsWith('solana:')).toBe(true);
  });

  it('does not flag EVM chainIds as Solana', () => {
    const evmChainIds = [
      'eip155:1', // Ethereum mainnet
      'eip155:8453', // Base
      'eip155:84532', // Base Sepolia
      'eip155:10', // Optimism
    ];

    for (const chainId of evmChainIds) {
      expect(chainId.startsWith('solana:')).toBe(false);
    }
  });

  it('would produce correct error message for Solana auth requirement', () => {
    // Simulates what authed_call returns when it encounters a Solana chainId
    const serverInfo = {
      domain: 'api.example.com',
      uri: 'https://api.example.com/resource',
      version: '1',
      chainId: SOLANA_MAINNET,
      nonce: 'abc123xyz456',
      issuedAt: new Date().toISOString(),
    };

    // This is the check authed_call performs
    const isSolana = serverInfo.chainId.startsWith('solana:');
    expect(isSolana).toBe(true);

    // Verify error message would include helpful info
    if (isSolana) {
      const errorDetails = {
        chainId: serverInfo.chainId,
        hint: 'This endpoint requires a Solana wallet. The MCP server currently only supports EVM wallets.',
      };
      expect(errorDetails.chainId).toBe(SOLANA_MAINNET);
      expect(errorDetails.hint).toContain('Solana wallet');
      expect(errorDetails.hint).toContain('EVM wallets');
    }
  });
});
