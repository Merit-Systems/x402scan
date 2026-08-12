import {
  logs,
  SeverityNumber,
  type LogAttributes,
} from '@opentelemetry/api-logs';
import { z } from 'zod';

import type { JsonValue } from '@/lib/json';

const primitiveAttributeSchema = z.union([z.string(), z.number(), z.boolean()]);

function coerceAttributes(
  attributes?: Record<string, JsonValue | undefined>
): LogAttributes | undefined {
  if (!attributes) return undefined;

  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (value === undefined || value === null) continue;

    const primitive = primitiveAttributeSchema.safeParse(value);
    if (primitive.success) {
      out[key] = primitive.data;
      continue;
    }

    // Objects/arrays: stringify for observability. JsonValue is always
    // serializable, but guard against runtime values that slipped past the
    // types (e.g. circular structures).
    try {
      out[key] = JSON.stringify(value);
    } catch {
      out[key] = '[non-serializable]';
    }
  }

  return out;
}

function getApiLogger() {
  return logs.getLogger('scan-api');
}

export function signozLogInfo(
  message: string,
  attributes?: Record<string, JsonValue | undefined>
) {
  getApiLogger().emit({
    body: message,
    severityNumber: SeverityNumber.INFO,
    severityText: 'INFO',
    attributes: coerceAttributes(attributes),
  });
}
