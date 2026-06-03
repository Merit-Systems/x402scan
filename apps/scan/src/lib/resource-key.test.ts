import { describe, it, expect } from 'vitest';
import { resourceKey } from './resource-key';

describe('resourceKey', () => {
  it('prefixes method when provided', () => {
    expect(resourceKey('https://api.example.com/foo', 'GET')).toBe(
      'GET::https://api.example.com/foo'
    );
    expect(resourceKey('https://api.example.com/foo', 'POST')).toBe(
      'POST::https://api.example.com/foo'
    );
  });

  it('returns bare URL when method is undefined', () => {
    expect(resourceKey('https://api.example.com/foo')).toBe(
      'https://api.example.com/foo'
    );
    expect(resourceKey('https://api.example.com/foo', undefined)).toBe(
      'https://api.example.com/foo'
    );
  });

  it('returns bare URL when method is empty string', () => {
    expect(resourceKey('https://api.example.com/foo', '')).toBe(
      'https://api.example.com/foo'
    );
  });

  it('produces distinct keys for different methods on the same URL', () => {
    const url = 'https://api.example.com/credits';
    const getKey = resourceKey(url, 'GET');
    const postKey = resourceKey(url, 'POST');
    expect(getKey).not.toBe(postKey);
  });

  it('produces same key for same method+URL', () => {
    const url = 'https://api.example.com/credits';
    expect(resourceKey(url, 'POST')).toBe(resourceKey(url, 'POST'));
  });

  it('legacy (no method) and explicit method produce different keys', () => {
    const url = 'https://api.example.com/credits';
    expect(resourceKey(url)).not.toBe(resourceKey(url, 'GET'));
  });
});
