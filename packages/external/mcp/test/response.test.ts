import { describe, it, expect } from 'vitest';
import { mcpSuccess, mcpError, formatUSDC, parseUSDC } from '../src/response';

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

describe('formatUSDC', () => {
  it('formats whole dollars', () => {
    expect(formatUSDC(1_000_000n)).toBe('$1.00');
    expect(formatUSDC(10_000_000n)).toBe('$10.00');
    expect(formatUSDC(100_000_000n)).toBe('$100.00');
  });

  it('formats cents', () => {
    expect(formatUSDC(1_500_000n)).toBe('$1.50');
    expect(formatUSDC(1_990_000n)).toBe('$1.99');
    expect(formatUSDC(10_000n)).toBe('$0.01');
  });

  it('formats zero', () => {
    expect(formatUSDC(0n)).toBe('$0.00');
  });

  it('formats small amounts', () => {
    expect(formatUSDC(100n)).toBe('$0.00'); // Rounds down
    expect(formatUSDC(5_000n)).toBe('$0.01'); // Rounds up
  });
});

describe('parseUSDC', () => {
  it('parses dollar string', () => {
    expect(parseUSDC('$1.00')).toBe(1_000_000n);
    expect(parseUSDC('$10.50')).toBe(10_500_000n);
  });

  it('parses without dollar sign', () => {
    expect(parseUSDC('1.00')).toBe(1_000_000n);
    expect(parseUSDC('0.01')).toBe(10_000n);
  });

  it('handles whitespace', () => {
    expect(parseUSDC(' $5.00 ')).toBe(5_000_000n);
  });
});
