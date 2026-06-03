import { describe, it, expect } from 'vitest';
import { isTunnelUrl } from './url-helpers';

describe('isTunnelUrl', () => {
  it('detects trycloudflare tunnels', () => {
    expect(
      isTunnelUrl(
        'https://peter-microphone-longitude-lee.trycloudflare.com/api/test'
      )
    ).toBe(true);
  });

  it('detects ngrok tunnels', () => {
    expect(isTunnelUrl('https://abc123.ngrok.io/path')).toBe(true);
    expect(isTunnelUrl('https://abc123.ngrok-free.app/path')).toBe(true);
    expect(isTunnelUrl('https://abc123.ngrok.app/path')).toBe(true);
  });

  it('detects other tunnel services', () => {
    expect(isTunnelUrl('https://abc.loca.lt')).toBe(true);
    expect(isTunnelUrl('https://abc.serveo.net')).toBe(true);
    expect(isTunnelUrl('https://abc.localhost.run')).toBe(true);
    expect(isTunnelUrl('https://abc.bore.pub')).toBe(true);
    expect(isTunnelUrl('https://abc.tunnelmole.com')).toBe(true);
  });

  it('allows permanent domains', () => {
    expect(isTunnelUrl('https://api.example.com/path')).toBe(false);
    expect(isTunnelUrl('https://stableenrich.dev/api')).toBe(false);
    expect(isTunnelUrl('https://x402scan.com')).toBe(false);
  });

  it('does not false-positive on domains containing tunnel names', () => {
    expect(isTunnelUrl('https://ngrok-docs.example.com')).toBe(false);
    expect(isTunnelUrl('https://my-trycloudflare.com')).toBe(false);
  });

  it('returns false for invalid URLs', () => {
    expect(isTunnelUrl('not-a-url')).toBe(false);
    expect(isTunnelUrl('')).toBe(false);
  });
});
