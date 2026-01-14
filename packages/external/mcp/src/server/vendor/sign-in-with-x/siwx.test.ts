/**
 * Tests for vendored Sign-In-With-X implementation
 */

import { describe, it, expect } from 'vitest';
import { privateKeyToAccount } from 'viem/accounts';
import {
  declareSIWxExtension,
  createSIWxPayload,
  encodeSIWxHeader,
  parseSIWxHeader,
  validateSIWxMessage,
  verifySIWxSignature,
  SIGN_IN_WITH_X,
} from './index.js';

// Test wallet (DO NOT use in production)
const TEST_PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const testAccount = privateKeyToAccount(TEST_PRIVATE_KEY);

describe('Sign-In-With-X', () => {
  const testUri = 'https://api.example.com/resource';
  const testNetwork = 'eip155:8453'; // Base

  it('creates valid extension declaration', () => {
    const extensions = declareSIWxExtension({
      domain: 'api.example.com',
      resourceUri: testUri,
      network: testNetwork,
      statement: 'Test authentication',
    });

    const ext = extensions[SIGN_IN_WITH_X];
    expect(ext).toBeDefined();
    expect(ext!.info.domain).toBe('api.example.com');
    expect(ext!.info.uri).toBe(testUri);
    expect(ext!.info.chainId).toBe(testNetwork);
    expect(ext!.info.nonce).toHaveLength(32); // 16 bytes hex
    expect(ext!.info.issuedAt).toBeDefined();
    expect(ext!.info.expirationTime).toBeDefined();
  });

  it('creates and signs payload with wallet', async () => {
    const extensions = declareSIWxExtension({
      domain: 'api.example.com',
      resourceUri: testUri,
      network: testNetwork,
    });

    const payload = await createSIWxPayload(
      extensions[SIGN_IN_WITH_X]!.info,
      testAccount
    );

    expect(payload.address).toBe(testAccount.address);
    expect(payload.signature).toMatch(/^0x[a-fA-F0-9]+$/);
    expect(payload.domain).toBe('api.example.com');
    expect(payload.chainId).toBe(testNetwork);
  });

  it('encodes payload as base64', async () => {
    const extensions = declareSIWxExtension({
      domain: 'api.example.com',
      resourceUri: testUri,
      network: testNetwork,
    });

    const payload = await createSIWxPayload(
      extensions[SIGN_IN_WITH_X]!.info,
      testAccount
    );

    const encoded = encodeSIWxHeader(payload);

    // Should be valid base64
    expect(() => Buffer.from(encoded, 'base64')).not.toThrow();

    // Should decode to valid JSON with expected fields
    const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString()) as {
      address: string;
      signature: string;
    };
    expect(decoded.address).toBe(testAccount.address);
    expect(decoded.signature).toBeDefined();
  });

  it('round-trips: create -> encode -> parse -> validate -> verify', async () => {
    const extensions = declareSIWxExtension({
      domain: 'api.example.com',
      resourceUri: testUri,
      network: testNetwork,
      statement: 'Round-trip test',
    });

    // Create and sign
    const payload = await createSIWxPayload(
      extensions[SIGN_IN_WITH_X]!.info,
      testAccount
    );

    // Encode for header
    const header = encodeSIWxHeader(payload);

    // Parse from header (as server would)
    const parsed = parseSIWxHeader(header);
    expect(parsed.address).toBe(testAccount.address);

    // Validate message fields
    const validation = await validateSIWxMessage(parsed, testUri);
    expect(validation.valid).toBe(true);

    // Verify signature cryptographically
    const verification = await verifySIWxSignature(parsed);
    expect(verification.valid).toBe(true);
    expect(verification.address?.toLowerCase()).toBe(
      testAccount.address.toLowerCase()
    );
  });

  it('rejects tampered payload', async () => {
    const extensions = declareSIWxExtension({
      domain: 'api.example.com',
      resourceUri: testUri,
      network: testNetwork,
    });

    const payload = await createSIWxPayload(
      extensions[SIGN_IN_WITH_X]!.info,
      testAccount
    );

    // Tamper with the payload
    const tampered = {
      ...payload,
      address: '0x1234567890123456789012345678901234567890',
    };

    // Verification should fail
    const verification = await verifySIWxSignature(tampered);
    expect(verification.valid).toBe(false);
  });
});
