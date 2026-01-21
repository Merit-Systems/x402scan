import { describe, it, expect } from 'vitest';
import { mcpSuccess, mcpError } from '../src/server/lib/response';

describe('mcpSuccess', () => {
  it('wraps data in MCP content format', () => {
    const result = mcpSuccess({ foo: 'bar' });

    expect(result.content).toHaveLength(1);
    expect(result.content[0]?.type).toBe('text');
    expect(JSON.parse(result.content[0]?.text ?? '')).toEqual({ foo: 'bar' });
  });

  it('pretty-prints JSON', () => {
    const result = mcpSuccess({ key: 'value' });
    expect(result.content[0]?.text).toContain('\n');
  });
});

describe('mcpError', () => {
  it('formats Error object', () => {
    const result = mcpError(new Error('Something failed'));

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    const parsed = JSON.parse(result.content[0]?.text ?? '') as Record<
      string,
      unknown
    >;
    expect(parsed.error).toBe('Something failed');
  });

  it('formats string error', () => {
    const result = mcpError('Simple error');

    const parsed = JSON.parse(result.content[0]?.text ?? '') as Record<
      string,
      unknown
    >;
    expect(parsed.error).toBe('Simple error');
  });

  it('includes context when provided', () => {
    const result = mcpError('Failed', {
      tool: 'test_tool',
      url: 'http://example.com',
    });

    const parsed = JSON.parse(result.content[0]?.text ?? '') as Record<
      string,
      unknown
    >;
    expect(parsed.error).toBe('Failed');
    expect(parsed.context).toEqual({
      tool: 'test_tool',
      url: 'http://example.com',
    });
  });

  it('extracts cause from Error', () => {
    const error = new Error('Outer');
    (error as Error & { cause: string }).cause = 'Inner cause';
    const result = mcpError(error);

    const parsed = JSON.parse(result.content[0]?.text ?? '') as {
      details?: { cause: string };
    };
    expect(parsed.details?.cause).toBe('Inner cause');
  });
});
