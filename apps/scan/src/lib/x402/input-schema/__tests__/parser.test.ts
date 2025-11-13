import { describe, it, expect } from 'vitest';
import { parseInputFields } from '../parser';

describe('parseInputFields', () => {
  describe('empty and null inputs', () => {
    it('should handle null input', () => {
      const result = parseInputFields(null, 'queryParams');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('should handle undefined input', () => {
      const result = parseInputFields(undefined, 'queryParams');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('should handle empty object', () => {
      const result = parseInputFields({}, 'queryParams');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe('string shorthand format', () => {
    it('should parse simple string types', () => {
      const fields = {
        name: 'string',
        age: 'number',
        active: 'boolean',
      };

      const result = parseInputFields(fields, 'queryParams');
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toHaveLength(3);
        expect(result.data[0]).toMatchObject({
          name: 'name',
          type: 'string',
          required: false,
        });
        expect(result.data[1]).toMatchObject({
          name: 'age',
          type: 'number',
          required: false,
        });
        expect(result.data[2]).toMatchObject({
          name: 'active',
          type: 'boolean',
          required: false,
        });
      }
    });
  });

  describe('simplified format', () => {
    it('should parse simplified format with required field', () => {
      const fields = {
        location: {
          type: 'string',
          description: 'City name or coordinates',
          required: true,
        },
      };

      const result = parseInputFields(fields, 'queryParams');
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0]).toMatchObject({
          name: 'location',
          type: 'string',
          description: 'City name or coordinates',
          required: true,
        });
      }
    });

    it('should parse fields with enum', () => {
      const fields = {
        size: {
          type: 'string',
          enum: ['S', 'M', 'L', 'XL'],
          default: 'M',
        },
      };

      const result = parseInputFields(fields, 'bodyFields');
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0]).toMatchObject({
          name: 'size',
          type: 'string',
          enum: ['S', 'M', 'L', 'XL'],
          default: 'M',
        });
      }
    });
  });

  describe('JSON Schema format', () => {
    it('should parse full JSON Schema fields', () => {
      const fields = {
        email: {
          type: 'string',
          format: 'email',
          description: 'User email address',
          minLength: 5,
        },
      };

      const result = parseInputFields(fields, 'queryParams');
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0]).toMatchObject({
          name: 'email',
          type: 'string',
          description: 'User email address',
        });
      }
    });

    it('should parse fields with pattern', () => {
      const fields = {
        zipCode: {
          type: 'string',
          pattern: '^[0-9]{5}$',
          description: 'US ZIP code',
        },
      };

      const result = parseInputFields(fields, 'queryParams');
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].name).toBe('zipCode');
      }
    });
  });

  describe('nested objects', () => {
    it('should expand nested object properties', () => {
      const fields = {
        address: {
          type: 'object',
          properties: {
            street: { type: 'string' },
            city: { type: 'string' },
            zipCode: { type: 'string' },
          },
          required: ['street', 'city'],
        },
      };

      const result = parseInputFields(fields, 'bodyFields');
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toHaveLength(3);

        const streetField = result.data.find(f => f.name === 'address.street');
        const cityField = result.data.find(f => f.name === 'address.city');
        const zipField = result.data.find(f => f.name === 'address.zipCode');

        expect(streetField).toBeDefined();
        expect(streetField?.required).toBe(true);
        expect(cityField).toBeDefined();
        expect(cityField?.required).toBe(true);
        expect(zipField).toBeDefined();
        expect(zipField?.required).toBe(false);
      }
    });

    it('should handle deeply nested objects', () => {
      const fields = {
        user: {
          type: 'object',
          properties: {
            profile: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                age: { type: 'number' },
              },
            },
          },
        },
      };

      const result = parseInputFields(fields, 'bodyFields');
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data.find(f => f.name === 'user.profile.name')).toBeDefined();
        expect(result.data.find(f => f.name === 'user.profile.age')).toBeDefined();
      }
    });
  });

  describe('array fields', () => {
    it('should parse array with simple item type', () => {
      const fields = {
        tags: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      };

      const result = parseInputFields(fields, 'bodyFields');
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0]).toMatchObject({
          name: 'tags',
          type: 'array',
        });
        expect(result.data[0].items).toBeDefined();
        expect(result.data[0].items?.type).toBe('string');
      }
    });

    it('should parse array with object items', () => {
      const fields = {
        messages: {
          type: 'array',
          description: 'Array of messages',
          items: {
            type: 'object',
            properties: {
              role: {
                type: 'string',
                enum: ['user', 'assistant'],
              },
              content: {
                type: 'string',
              },
            },
            required: ['role', 'content'],
          },
        },
      };

      const result = parseInputFields(fields, 'bodyFields');
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].type).toBe('array');
        expect(result.data[0].items?.properties).toBeDefined();
        expect(result.data[0].items?.required).toEqual(['role', 'content']);
      }
    });
  });

  describe('real-world examples', () => {
    it('should parse Gloria AI news endpoint schema', () => {
      const fields = {
        feed_categories: {
          type: 'string',
          description: 'Comma separated list of feed categories',
          required: true,
        },
        from_date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format',
          required: false,
        },
        to_date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format',
          required: false,
        },
        page: {
          type: 'string',
          description: 'Page number',
          required: false,
        },
        limit: {
          type: 'string',
          description: 'Number of results per page',
          required: false,
        },
      };

      const result = parseInputFields(fields, 'queryParams');
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toHaveLength(5);
        const feedField = result.data.find(f => f.name === 'feed_categories');
        expect(feedField?.required).toBe(true);
      }
    });

    it('should parse complex address schema', () => {
      const fields = {
        address_to: {
          type: 'object',
          properties: {
            first_name: {
              type: 'string',
              minLength: 1,
            },
            last_name: {
              type: 'string',
              minLength: 1,
            },
            email: {
              type: 'string',
              format: 'email',
              pattern: '^(?!\\.)(?!.*\\.\\.)([A-Za-z0-9_\'+\\-\\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$',
            },
            country: {
              type: 'string',
              pattern: '^[A-Z]{2}$',
            },
          },
          required: ['first_name', 'last_name', 'email', 'country'],
        },
      };

      const result = parseInputFields(fields, 'bodyFields');
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.length).toBeGreaterThan(0);
        const firstNameField = result.data.find(f => f.name === 'address_to.first_name');
        expect(firstNameField?.required).toBe(true);
      }
    });
  });

  describe('error handling', () => {
    it('should return errors for invalid pattern', () => {
      const fields = {
        value: {
          type: 'string',
          pattern: '[invalid(regex',
        },
      };

      const result = parseInputFields(fields, 'queryParams');
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].code).toBe('INVALID_PATTERN');
      }
    });

    it('should return errors for invalid range constraints', () => {
      const fields = {
        age: {
          type: 'number',
          minimum: 100,
          maximum: 10,
        },
      };

      const result = parseInputFields(fields, 'queryParams');
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].code).toBe('INVALID_RANGE');
      }
    });

    it('should prefix error paths with context', () => {
      const fields = {
        age: {
          type: 'number',
          minimum: 100,
          maximum: 10,
        },
      };

      const result = parseInputFields(fields, 'bodyFields');
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.errors[0].path[0]).toBe('bodyFields');
      }
    });
  });

  describe('composition keywords', () => {
    it('should handle anyOf with null', () => {
      const fields = {
        value: {
          anyOf: [
            { type: 'string', minLength: 1 },
            { type: 'null' },
          ],
        },
      };

      const result = parseInputFields(fields, 'queryParams');
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });

    it('should handle oneOf', () => {
      const fields = {
        contact: {
          oneOf: [
            { type: 'string', format: 'email' },
            { type: 'string', pattern: '^\\+[0-9]+$' },
          ],
        },
      };

      const result = parseInputFields(fields, 'queryParams');
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });
  });
});

