import { describe, expect, it } from 'vitest';

import { selectDiscoveredResourceForRegistration } from './url';

import type { DiscoveredResource } from '@/types/discovery';

const ORIGIN = 'https://merchant.example';

describe('selectDiscoveredResourceForRegistration', () => {
  it('fails closed when an excluded exact route overlaps an eligible template route', () => {
    const resources: DiscoveredResource[] = [
      {
        url: ORIGIN + '/items/{id}',
        method: 'GET',
        authMode: 'paid',
      },
      {
        url: ORIGIN + '/items/special',
        method: 'GET',
        authMode: 'paid',
        registryEligible: false,
      },
    ];

    const selected = selectDiscoveredResourceForRegistration(
      ORIGIN + '/items/special',
      resources,
      'GET'
    );

    expect(selected?.excluded).toBe(true);
    expect(selected?.resource.url).toBe(ORIGIN + '/items/special');
  });

  it('fails closed without a method if the same concrete path has any excluded operation', () => {
    const resources: DiscoveredResource[] = [
      {
        url: ORIGIN + '/items/special',
        method: 'GET',
        authMode: 'paid',
      },
      {
        url: ORIGIN + '/items/special',
        method: 'POST',
        authMode: 'paid',
        registryEligible: false,
      },
    ];

    expect(
      selectDiscoveredResourceForRegistration(
        ORIGIN + '/items/special',
        resources
      )?.excluded
    ).toBe(true);

    expect(
      selectDiscoveredResourceForRegistration(
        ORIGIN + '/items/special',
        resources,
        'GET'
      )?.excluded
    ).toBe(false);

    expect(
      selectDiscoveredResourceForRegistration(
        ORIGIN + '/items/special',
        resources,
        'POST'
      )?.excluded
    ).toBe(true);
  });

  it('prefers an exact eligible URL over a template when no match is excluded', () => {
    const resources: DiscoveredResource[] = [
      {
        url: ORIGIN + '/items/{id}',
        method: 'GET',
        authMode: 'paid',
      },
      {
        url: ORIGIN + '/items/special',
        method: 'GET',
        authMode: 'paid',
      },
    ];

    const selected = selectDiscoveredResourceForRegistration(
      ORIGIN + '/items/special',
      resources,
      'GET'
    );

    expect(selected?.excluded).toBe(false);
    expect(selected?.resource.url).toBe(ORIGIN + '/items/special');
  });

  it('prefers the exact path over a template when the input has query and hash', () => {
    const resources: DiscoveredResource[] = [
      {
        url: ORIGIN + '/items/{id}',
        method: 'GET',
        authMode: 'paid',
        queryParametersSchema: { required: ['templateOnly'] },
      },
      {
        url: ORIGIN + '/items/search',
        method: 'GET',
        authMode: 'paid',
        queryParametersSchema: { required: ['language'] },
      },
    ];

    const selected = selectDiscoveredResourceForRegistration(
      ORIGIN + '/items/search?language=en#section',
      resources,
      'GET'
    );

    expect(selected?.excluded).toBe(false);
    expect(selected?.resource.url).toBe(ORIGIN + '/items/search');
    expect(selected?.resource.queryParametersSchema).toEqual({
      required: ['language'],
    });
  });
});
