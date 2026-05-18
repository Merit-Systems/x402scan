import { describe, it, expect } from 'vitest';
import { buildSampleBodyFromInputSchema } from './build-sample-body';

describe('buildSampleBodyFromInputSchema', () => {
  it('respects exclusiveMinimum: 0 (agentcash /api/send regression)', () => {
    // Pulled from agentcash.dev's bazaar input body schema. The previous
    // builder emitted `amount: 0`, which agentcash's zod validator rejected
    // before the paywall, so the probe never saw a 402.
    const schema = {
      type: 'object',
      properties: {
        amount: { type: 'number', exclusiveMinimum: 0 },
        address: { type: 'string', minLength: 1 },
        network: { type: 'string', enum: ['base', 'tempo', 'solana'] },
      },
      required: ['amount', 'address', 'network'],
      additionalProperties: false,
    };

    const sample = buildSampleBodyFromInputSchema(schema);
    expect(sample).toBeDefined();
    expect(typeof sample!.amount).toBe('number');
    expect(sample!.amount).toBeGreaterThan(0);
    expect(sample!.address).toBe('0x0000000000000000000000000000000000000000');
    expect(sample!.network).toBe('base');
  });

  it('honors minimum (inclusive) on integers', () => {
    const sample = buildSampleBodyFromInputSchema({
      type: 'object',
      properties: { count: { type: 'integer', minimum: 5 } },
      required: ['count'],
    });
    expect(sample!.count).toBe(5);
  });

  it('snaps up to multipleOf above the minimum', () => {
    const sample = buildSampleBodyFromInputSchema({
      type: 'object',
      properties: {
        chunkSize: { type: 'integer', minimum: 1, multipleOf: 5 },
      },
      required: ['chunkSize'],
    });
    expect(sample!.chunkSize).toBe(5);
  });

  it('honors pre-draft-06 boolean exclusiveMinimum paired with minimum', () => {
    const sample = buildSampleBodyFromInputSchema({
      type: 'object',
      properties: {
        rate: { type: 'number', minimum: 0, exclusiveMinimum: true },
      },
      required: ['rate'],
    });
    expect(typeof sample!.rate).toBe('number');
    expect(sample!.rate).toBeGreaterThan(0);
  });

  it('derives a value below the maximum when 0 is excluded', () => {
    const sample = buildSampleBodyFromInputSchema({
      type: 'object',
      properties: { delta: { type: 'integer', maximum: -1 } },
      required: ['delta'],
    });
    expect(sample!.delta).toBeLessThanOrEqual(-1);
  });

  it('pads strings up to minLength', () => {
    const sample = buildSampleBodyFromInputSchema({
      type: 'object',
      properties: { token: { type: 'string', minLength: 32 } },
      required: ['token'],
    });
    expect(typeof sample!.token).toBe('string');
    expect((sample!.token as string).length).toBeGreaterThanOrEqual(32);
  });

  it('clamps strings down to maxLength', () => {
    const sample = buildSampleBodyFromInputSchema({
      type: 'object',
      properties: { tag: { type: 'string', maxLength: 3 } },
      required: ['tag'],
    });
    expect((sample!.tag as string).length).toBeLessThanOrEqual(3);
  });

  it('emits format-conformant strings for common formats', () => {
    const sample = buildSampleBodyFromInputSchema({
      type: 'object',
      properties: {
        contact: { type: 'string', format: 'email' },
        homepage: { type: 'string', format: 'uri' },
        id: { type: 'string', format: 'uuid' },
        when: { type: 'string', format: 'date-time' },
      },
      required: ['contact', 'homepage', 'id', 'when'],
    });
    expect(sample!.contact).toMatch(/.+@.+\..+/);
    expect(sample!.homepage).toMatch(/^https?:\/\//);
    expect(sample!.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
    expect(sample!.when).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('returns the const value when present', () => {
    const sample = buildSampleBodyFromInputSchema({
      type: 'object',
      properties: { kind: { const: 'http' } },
      required: ['kind'],
    });
    expect(sample!.kind).toBe('http');
  });

  it('clamps array length to maxItems', () => {
    const sample = buildSampleBodyFromInputSchema({
      type: 'object',
      properties: {
        tags: {
          type: 'array',
          minItems: 5,
          maxItems: 2,
          items: { type: 'string' },
        },
      },
      required: ['tags'],
    });
    expect(Array.isArray(sample!.tags)).toBe(true);
    expect((sample!.tags as unknown[]).length).toBe(2);
  });

  it('returns an image URL for uri-format fields named image', () => {
    const sample = buildSampleBodyFromInputSchema({
      type: 'object',
      properties: {
        image: { type: 'string', format: 'uri' },
        prompt: { type: 'string' },
      },
      required: ['image', 'prompt'],
    });
    expect(sample!.image).toMatch(/\.(png|jpg|jpeg|webp)/);
    expect(sample!.image).not.toBe('https://example.com');
  });

  it('returns an image URL for uri-format array items named images', () => {
    const sample = buildSampleBodyFromInputSchema({
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: { type: 'string', format: 'uri' },
          minItems: 1,
        },
        prompt: { type: 'string' },
      },
      required: ['images', 'prompt'],
    });
    const images = sample!.images as string[];
    expect(images).toHaveLength(1);
    expect(images[0]).toMatch(/\.(png|jpg|jpeg|webp)/);
  });

  it('returns an image URL for uri-format array items when parent description mentions image (seedance regression)', () => {
    const sample = buildSampleBodyFromInputSchema({
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          items: { type: 'string', format: 'uri' },
          minItems: 1,
          maxItems: 12,
          description: 'Public image/video reference URLs',
        },
        prompt: { type: 'string' },
      },
      required: ['urls', 'prompt'],
    });
    const urls = sample!.urls as string[];
    expect(urls).toHaveLength(1);
    expect(urls[0]).toMatch(/\.(png|jpg|jpeg|webp)/);
    expect(urls[0]).not.toBe('https://example.com');
  });

  it('returns https://example.com for uri-format fields without media names', () => {
    const sample = buildSampleBodyFromInputSchema({
      type: 'object',
      properties: {
        homepage: { type: 'string', format: 'uri' },
        callback: { type: 'string', format: 'url' },
      },
      required: ['homepage', 'callback'],
    });
    expect(sample!.homepage).toBe('https://example.com');
    expect(sample!.callback).toBe('https://example.com');
  });

  it('still defaults to 0 when no numeric bounds are given', () => {
    const sample = buildSampleBodyFromInputSchema({
      type: 'object',
      properties: { n: { type: 'number' } },
      required: ['n'],
    });
    expect(sample!.n).toBe(0);
  });
});
