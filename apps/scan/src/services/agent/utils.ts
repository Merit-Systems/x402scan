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

function fieldDefToZodType(
  fieldDef: FieldDef,
  parentRequired?: string[]
): z.ZodTypeAny {
  let zodType: z.ZodTypeAny;

  // Determine the required array for this field
  const requiredArray = Array.isArray(fieldDef.required)
    ? fieldDef.required
    : (parentRequired ?? []);

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
            // Check if this property is in the required array
            const isRequired = requiredArray.includes(key);
            // Use the subField's own required array if it exists, otherwise use parent's
            const subFieldRequired = Array.isArray(subField.required)
              ? subField.required
              : requiredArray;
            let subFieldType = fieldDefToZodType(subField, subFieldRequired);

            // If this property is not required, make it optional
            if (!isRequired) {
              subFieldType = subFieldType.optional();
            }

            shape[key] = subFieldType;
          }
          zodType = z.object(shape);
        } else {
          zodType = z.record(z.string(), z.unknown());
        }
        break;
      case 'array':
        if (fieldDef.items) {
          // Pass the required array to items processing
          zodType = z.array(fieldDefToZodType(fieldDef.items, requiredArray));
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

  // Only make the field optional if required is explicitly false
  // If required is an array, it's handled above for nested objects
  if (fieldDef.required === false) {
    zodType = zodType.optional();
  } else if (!fieldDef.required && !Array.isArray(fieldDef.required)) {
    // If required is undefined and not an array, make optional
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
