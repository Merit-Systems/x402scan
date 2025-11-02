import { describe, it, expect } from 'vitest';

// Import the functions we want to test
// Note: These functions are not exported, so we need to copy them for testing
function expandFields(
  record: Record<string, unknown>,
  prefix = '',
  parentRequired?: string[]
): Array<{
  name: string;
  type?: string;
  description?: string;
  required?: boolean;
  enum?: string[];
  default?: string;
}> {
  const fields: Array<{
    name: string;
    type?: string;
    description?: string;
    required?: boolean;
    enum?: string[];
    default?: string;
  }> = [];

  for (const [name, raw] of Object.entries(record)) {
    const fullName = prefix ? `${prefix}.${name}` : name;

    if (typeof raw === 'string') {
      fields.push({
        name: fullName,
        type: raw,
        required: parentRequired?.includes(name) ?? false,
        enum: undefined,
        default: undefined,
      });
      continue;
    }

    if (typeof raw !== 'object' || !raw) {
      continue;
    }

    const field = raw as Record<string, unknown>;
    const fieldType = typeof field.type === 'string' ? field.type : undefined;
    const fieldDescription =
      typeof field.description === 'string' ? field.description : undefined;
    const fieldEnum = Array.isArray(field.enum)
      ? (field.enum as string[])
      : undefined;
    const fieldDefault =
      typeof field.default === 'string' ? field.default : undefined;

    // Determine if this field is required
    const isFieldRequired =
      typeof field.required === 'boolean'
        ? field.required
        : (parentRequired?.includes(name) ?? false);

    // Handle object type with properties - expand recursively
    if (
      fieldType === 'object' &&
      field.properties &&
      typeof field.properties === 'object'
    ) {
      const objectRequired = Array.isArray(field.required)
        ? field.required
        : [];
      const expandedFields = expandFields(
        field.properties as Record<string, unknown>,
        fullName,
        objectRequired
      );
      fields.push(...expandedFields);
    } else {
      // Regular field or object without properties
      fields.push({
        name: fullName,
        type: fieldType,
        description: fieldDescription,
        required: isFieldRequired,
        enum: fieldEnum,
        default: fieldDefault,
      });
    }
  }

  return fields;
}

function reconstructNestedObject(
  flatObject: Record<string, string>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(flatObject)) {
    const parts = key.split('.');
    let current = result;

    // Navigate/create nested structure
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }

    // Set the final value
    const finalKey = parts[parts.length - 1];
    current[finalKey] = value;
  }

  return result;
}

describe('Field Expansion', () => {
  it('should expand nested object properties into individual fields', () => {
    const input = {
      prompt: {
        type: 'string',
        description: 'The prompt text',
        required: true,
      },
      color: {
        type: 'string',
        description: 'Color selection',
        default: 'White',
        enum: ['Black', 'White'],
      },
      bankData: {
        type: 'object',
        description: 'Bank information',
        required: ['bankAccountName'],
        properties: {
          bankAccountName: {
            type: 'string',
            description: 'Bank account name',
          },
          bankCode: {
            type: 'string',
            description: 'Bank code',
          },
        },
      },
    };

    const result = expandFields(input);

    expect(result).toHaveLength(4);

    // Check regular field
    expect(result[0]).toEqual({
      name: 'prompt',
      type: 'string',
      description: 'The prompt text',
      required: true,
      enum: undefined,
      default: undefined,
    });

    // Check enum field
    expect(result[1]).toEqual({
      name: 'color',
      type: 'string',
      description: 'Color selection',
      required: false,
      enum: ['Black', 'White'],
      default: 'White',
    });

    // Check expanded nested fields
    expect(result[2]).toEqual({
      name: 'bankData.bankAccountName',
      type: 'string',
      description: 'Bank account name',
      required: true, // Should be true because it's in the parent's required array
      enum: undefined,
      default: undefined,
    });

    expect(result[3]).toEqual({
      name: 'bankData.bankCode',
      type: 'string',
      description: 'Bank code',
      required: false, // Should be false because it's not in the parent's required array
      enum: undefined,
      default: undefined,
    });
  });

  it('should handle deeply nested objects', () => {
    const input = {
      user: {
        type: 'object',
        properties: {
          profile: {
            type: 'object',
            required: ['name'],
            properties: {
              name: {
                type: 'string',
                description: 'User name',
              },
              age: {
                type: 'number',
                description: 'User age',
              },
            },
          },
        },
      },
    };

    const result = expandFields(input);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('user.profile.name');
    expect(result[0].required).toBe(true);
    expect(result[0].enum).toBeUndefined();
    expect(result[0].default).toBeUndefined();
    expect(result[1].name).toBe('user.profile.age');
    expect(result[1].required).toBe(false);
    expect(result[1].enum).toBeUndefined();
    expect(result[1].default).toBeUndefined();
  });
});

describe('Object Reconstruction', () => {
  it('should reconstruct nested objects from flat dot-notation fields', () => {
    const input = {
      prompt: 'test prompt',
      'bankData.bankAccountName': 'John Doe',
      'bankData.bankCode': '123456',
      'user.profile.name': 'Jane',
      'user.profile.age': '25',
    };

    const result = reconstructNestedObject(input);

    expect(result).toEqual({
      prompt: 'test prompt',
      bankData: {
        bankAccountName: 'John Doe',
        bankCode: '123456',
      },
      user: {
        profile: {
          name: 'Jane',
          age: '25',
        },
      },
    });
  });

  it('should handle single-level fields', () => {
    const input = {
      name: 'test',
      email: 'test@example.com',
    };

    const result = reconstructNestedObject(input);

    expect(result).toEqual({
      name: 'test',
      email: 'test@example.com',
    });
  });
});
