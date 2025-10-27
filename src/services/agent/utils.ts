import { z } from 'zod';

import type { EnhancedOutputSchema } from '@/lib/x402/schema';

type FieldDef = {
  type?: string;
  required?: boolean | string[];
  description?: string;
  enum?: string[];
  properties?: Record<string, FieldDef>;
  items?: FieldDef;
};

function fieldDefToZodType(fieldDef: FieldDef): z.ZodTypeAny {
  let zodType: z.ZodTypeAny;

  if (fieldDef.enum) {
    zodType = z.enum(fieldDef.enum as [string, ...string[]]);
  } else {
    switch (fieldDef.type) {
      case 'number':
      case 'integer':
        zodType = z.number();
        break;
      case 'boolean':
        zodType = z.boolean();
        break;
      case 'object':
        if (fieldDef.properties) {
          const shape: Record<string, z.ZodTypeAny> = {};
          for (const [key, subField] of Object.entries(fieldDef.properties)) {
            shape[key] = fieldDefToZodType(subField);
          }
          zodType = z.object(shape);
        } else {
          zodType = z.record(z.string(), z.unknown());
        }
        break;
      case 'array':
        if (fieldDef.items) {
          zodType = z.array(fieldDefToZodType(fieldDef.items));
        } else {
          zodType = z.array(z.string());
        }
        break;
      default:
        zodType = z.string();
    }
  }

  if (fieldDef.description) {
    zodType = zodType.describe(fieldDef.description);
  }

  if (!fieldDef.required) {
    zodType = zodType.optional();
  }

  return zodType;
}

export const inputSchemaToZodSchema = (
  inputSchema: EnhancedOutputSchema['input']
) => {
  const method = inputSchema.method.toUpperCase();
  const shape: Record<string, z.ZodTypeAny> = {};

  // For GET/HEAD/OPTIONS: use query params
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    if (inputSchema.queryParams) {
      for (const [key, fieldDef] of Object.entries(inputSchema.queryParams)) {
        shape[key] = fieldDefToZodType(fieldDef as FieldDef);
      }
    }
  }
  // For POST/PUT/PATCH/DELETE: use body fields
  else {
    if (inputSchema.bodyFields) {
      for (const [key, fieldDef] of Object.entries(inputSchema.bodyFields)) {
        shape[key] = fieldDefToZodType(fieldDef as FieldDef);
      }
    }
  }

  return z.object(shape);
};
