import { describe, expect, it } from 'vitest';

import { buildSampleBodyFromInputSchema } from './build-sample-body';

describe('buildSampleBodyFromInputSchema', () => {
  it('returns undefined for non-object inputs', () => {
    expect(buildSampleBodyFromInputSchema(undefined)).toBeUndefined();
    expect(buildSampleBodyFromInputSchema(null)).toBeUndefined();
    expect(buildSampleBodyFromInputSchema('foo')).toBeUndefined();
  });

  it('walks required fields with default samples for primitive types', () => {
    const sample = buildSampleBodyFromInputSchema({
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
        active: { type: 'boolean' },
      },
      required: ['name', 'age', 'active'],
    });

    expect(sample).toEqual({ name: 'sample', age: 0, active: false });
  });

  it('honors exclusiveMinimum on numbers (regression: agentcash.dev/api/send)', () => {
    // The agentcash.dev `/api/send` endpoint rejects amount=0 with HTTP 400
    // before its paywall middleware can issue a 402 challenge, so the probe
    // sample needs to satisfy `exclusiveMinimum: 0`.
    const sample = buildSampleBodyFromInputSchema({
      type: 'object',
      properties: {
        amount: { type: 'number', exclusiveMinimum: 0 },
        address: { type: 'string', minLength: 1 },
        network: { type: 'string', enum: ['base', 'tempo', 'solana'] },
      },
      required: ['amount', 'address', 'network'],
    })!;

    expect(sample.amount).toBeTypeOf('number');
    expect(Number(sample.amount)).toBeGreaterThan(0);
    expect(sample.address).toBe('sample');
    expect(sample.network).toBe('base');
  });

  it('honors minimum on integers without overshooting the lower bound', () => {
    const sample = buildSampleBodyFromInputSchema({
      type: 'object',
      properties: {
        page: { type: 'integer', minimum: 1 },
      },
      required: ['page'],
    })!;

    expect(sample.page).toBe(1);
  });

  it('produces an integer (not a float) for exclusiveMinimum on integer fields', () => {
    const sample = buildSampleBodyFromInputSchema({
      type: 'object',
      properties: {
        count: { type: 'integer', exclusiveMinimum: 0 },
      },
      required: ['count'],
    })!;

    expect(sample.count).toBe(1);
    expect(Number.isInteger(sample.count)).toBe(true);
  });

  it('honors minLength on strings by padding the default sample', () => {
    const sample = buildSampleBodyFromInputSchema({
      type: 'object',
      properties: {
        token: { type: 'string', minLength: 10 },
      },
      required: ['token'],
    })!;

    expect(typeof sample.token).toBe('string');
    expect(String(sample.token).length).toBeGreaterThanOrEqual(10);
  });

  it('prefers explicit example over computed sample', () => {
    const sample = buildSampleBodyFromInputSchema({
      type: 'object',
      properties: {
        amount: { type: 'number', exclusiveMinimum: 0, example: 42 },
      },
      required: ['amount'],
    })!;

    expect(sample.amount).toBe(42);
  });

  it('unwraps `{ requestBody, parameters }` shape from @agentcash/discovery', () => {
    const sample = buildSampleBodyFromInputSchema({
      requestBody: {
        type: 'object',
        properties: {
          email: { type: 'string', minLength: 1 },
        },
        required: ['email'],
      },
      parameters: { in: 'query', name: 'foo' },
    });

    expect(sample).toEqual({ email: 'sample' });
  });
});
