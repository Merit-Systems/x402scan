import { describe, expect, it } from 'vitest';

import { isLocalUrl } from './url-helpers';

describe('isLocalUrl', () => {
  it.each([
    'http://localhost:3000',
    'http://app.local',
    'http://service.localhost',
    'http://127.10.0.1',
    'http://0.0.0.0',
    'http://10.1.2.3',
    'http://100.64.0.1',
    'http://169.254.1.1',
    'http://172.16.0.1',
    'http://172.31.255.255',
    'http://192.168.0.1',
    'http://198.18.0.1',
    'http://[::1]',
    'http://[fc00::1]',
    'http://[fd12::1]',
    'http://[fe80::1]',
  ])('returns true for local or private URL %s', url => {
    expect(isLocalUrl(url)).toBe(true);
  });

  it.each([
    'https://example.com',
    'https://api.x402scan.com',
    'http://8.8.8.8',
    'http://172.32.0.1',
    'http://[2606:4700:4700::1111]',
  ])('returns false for public URL %s', url => {
    expect(isLocalUrl(url)).toBe(false);
  });
});
