import { z } from "zod";

import type { FieldDef, OutputSchemaV1 } from "@/lib/x402";

function fieldDefToZodType(fieldDef: FieldDef): z.ZodType {
  let zodType: z.ZodType;

  if (fieldDef.enum && fieldDef.enum.length > 0) {
    zodType = z.enum(fieldDef.enum);
  } else {
    switch (fieldDef.type) {
      case "number":
      case "integer":
        zodType = z.number();
        break;
      case "boolean":
        zodType = z.boolean();
        break;
      case "object":
        if (fieldDef.properties) {
          const fields: Record<string, z.ZodType> = {};
          for (const [key, subField] of Object.entries(fieldDef.properties)) {
            fields[key] = fieldDefToZodType(subField);
          }
          zodType = z.object(fields);
        } else {
          zodType = z.record(z.string(), z.unknown());
        }
        break;
      case "array":
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
  inputSchema: OutputSchemaV1["input"]
) => {
  const method = inputSchema.method.toUpperCase();
  const fields: Record<string, z.ZodType> = {};

  // For GET/HEAD/OPTIONS: use query params
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    if (inputSchema.queryParams) {
      for (const [key, fieldDef] of Object.entries(inputSchema.queryParams)) {
        fields[key] = fieldDefToZodType(fieldDef);
      }
    }
  }
  // For POST/PUT/PATCH/DELETE: use body fields
  else {
    if (inputSchema.bodyFields) {
      for (const [key, fieldDef] of Object.entries(inputSchema.bodyFields)) {
        fields[key] = fieldDefToZodType(fieldDef);
      }
    }
  }

  return z.object(fields);
};
