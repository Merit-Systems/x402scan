import { describe, expect, it } from 'vitest';

import {
  normalizeRegistrationCandidates,
  partitionRegistrationCandidates,
} from './registration-dedupe';

describe('registration duplicate detection', () => {
  it('matches query-bearing submissions against normalized stored URLs', () => {
    const url = 'https://api.example.com/check?capability=fact-check';
    const candidates = normalizeRegistrationCandidates([
      { url, method: 'get' },
    ]);

    expect(
      partitionRegistrationCandidates(candidates, [
        { resource: 'https://api.example.com/check', method: 'GET' },
      ])
    ).toEqual({ registered: [url], unregistered: [] });
  });

  it('treats an omitted candidate method as matching any stored method', () => {
    const url = 'https://api.example.com/check?capability=fact-check';
    const candidates = normalizeRegistrationCandidates([{ url }]);

    expect(
      partitionRegistrationCandidates(candidates, [
        { resource: 'https://api.example.com/check', method: 'POST' },
      ])
    ).toEqual({ registered: [url], unregistered: [] });
  });

  it('keeps different explicit methods distinct', () => {
    const url = 'https://api.example.com/check?capability=fact-check';
    const candidates = normalizeRegistrationCandidates([
      { url, method: 'POST' },
    ]);

    expect(
      partitionRegistrationCandidates(candidates, [
        { resource: 'https://api.example.com/check', method: 'GET' },
      ])
    ).toEqual({ registered: [], unregistered: [url] });
  });
});
