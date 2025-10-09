import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { infiniteQuerySchema, toPaginatedResponse } from '../pagination';

describe('Pagination Utilities', () => {
  describe('infiniteQuerySchema', () => {
    it('should create schema with string cursor', () => {
      const schema = infiniteQuerySchema(z.string());
      const result = schema.parse({ cursor: 'test-cursor' });

      expect(result.cursor).toBe('test-cursor');
      expect(result.limit).toBe(100); // default
    });

    it('should create schema with number cursor', () => {
      const schema = infiniteQuerySchema(z.number());
      const result = schema.parse({ cursor: 42 });

      expect(result.cursor).toBe(42);
      expect(result.limit).toBe(100);
    });

    it('should use default limit of 100', () => {
      const schema = infiniteQuerySchema(z.string());
      const result = schema.parse({});

      expect(result.limit).toBe(100);
    });

    it('should allow custom limit', () => {
      const schema = infiniteQuerySchema(z.string());
      const result = schema.parse({ limit: 50 });

      expect(result.limit).toBe(50);
    });

    it('should allow optional cursor', () => {
      const schema = infiniteQuerySchema(z.string());
      const result = schema.parse({ limit: 25 });

      expect(result.cursor).toBeUndefined();
      expect(result.limit).toBe(25);
    });

    it('should validate cursor type', () => {
      const schema = infiniteQuerySchema(z.number());

      // Should throw if cursor is wrong type
      expect(() => schema.parse({ cursor: 'not-a-number' })).toThrow();
    });

    it('should work with complex cursor types', () => {
      const cursorSchema = z.object({
        id: z.string(),
        timestamp: z.number(),
      });

      const schema = infiniteQuerySchema(cursorSchema);
      const result = schema.parse({
        cursor: { id: 'abc', timestamp: 123456 },
        limit: 10,
      });

      expect(result.cursor).toEqual({ id: 'abc', timestamp: 123456 });
      expect(result.limit).toBe(10);
    });

    it('should handle empty input with defaults', () => {
      const schema = infiniteQuerySchema(z.string());
      const result = schema.parse({});

      expect(result.cursor).toBeUndefined();
      expect(result.limit).toBe(100);
    });
  });

  describe('toPaginatedResponse', () => {
    it('should return all items when count equals limit', () => {
      const items = [1, 2, 3, 4, 5];
      const result = toPaginatedResponse({ items, limit: 5 });

      expect(result.items).toEqual([1, 2, 3, 4, 5]);
      expect(result.hasNextPage).toBe(false);
    });

    it('should return all items when count is less than limit', () => {
      const items = [1, 2, 3];
      const result = toPaginatedResponse({ items, limit: 5 });

      expect(result.items).toEqual([1, 2, 3]);
      expect(result.hasNextPage).toBe(false);
    });

    it('should slice items and indicate next page when count exceeds limit', () => {
      const items = [1, 2, 3, 4, 5, 6];
      const result = toPaginatedResponse({ items, limit: 5 });

      expect(result.items).toEqual([1, 2, 3, 4, 5]);
      expect(result.hasNextPage).toBe(true);
    });

    it('should work with limit of 1', () => {
      const items = [1, 2, 3];
      const result = toPaginatedResponse({ items, limit: 1 });

      expect(result.items).toEqual([1]);
      expect(result.hasNextPage).toBe(true);
    });

    it('should handle empty items array', () => {
      const items: number[] = [];
      const result = toPaginatedResponse({ items, limit: 5 });

      expect(result.items).toEqual([]);
      expect(result.hasNextPage).toBe(false);
    });

    it('should work with object items', () => {
      const items = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
      ];
      const result = toPaginatedResponse({ items, limit: 2 });

      expect(result.items).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]);
      expect(result.hasNextPage).toBe(true);
    });

    it('should work with string items', () => {
      const items = ['a', 'b', 'c', 'd'];
      const result = toPaginatedResponse({ items, limit: 3 });

      expect(result.items).toEqual(['a', 'b', 'c']);
      expect(result.hasNextPage).toBe(true);
    });

    it('should indicate no next page when items exactly equal limit', () => {
      const items = [1, 2, 3, 4, 5];
      const result = toPaginatedResponse({ items, limit: 5 });

      expect(result.items.length).toBe(5);
      expect(result.hasNextPage).toBe(false);
    });

    it('should indicate next page when items are limit + 1', () => {
      const items = [1, 2, 3, 4, 5, 6];
      const result = toPaginatedResponse({ items, limit: 5 });

      expect(result.items.length).toBe(5);
      expect(result.hasNextPage).toBe(true);
    });

    it('should handle large datasets', () => {
      const items = Array.from({ length: 1000 }, (_, i) => i);
      const result = toPaginatedResponse({ items, limit: 100 });

      expect(result.items.length).toBe(100);
      expect(result.hasNextPage).toBe(true);
      expect(result.items[0]).toBe(0);
      expect(result.items[99]).toBe(99);
    });
  });
});