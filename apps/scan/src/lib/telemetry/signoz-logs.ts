import {
  logs,
  SeverityNumber,
  type LogAttributes,
} from '@opentelemetry/api-logs';

function coerceAttributes(
  attributes?: Record<string, unknown>
): LogAttributes | undefined {
  if (!attributes) return undefined;

  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (value === undefined || value === null) continue;

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      out[key] = value;
      continue;
    }

    // Avoid throwing on objects/arrays; stringify for observability.
    try {
      out[key] = JSON.stringify(value);
    } catch {
      out[key] = `[non-serializable: ${typeof value}]`;
    }
  }

  return out;
}

function getApiLogger() {
  return logs.getLogger('scan-api');
}

export function signozLogInfo(
  message: string,
  attributes?: Record<string, unknown>
) {
  getApiLogger().emit({
    body: message,
    severityNumber: SeverityNumber.INFO,
    severityText: 'INFO',
    attributes: coerceAttributes(attributes),
  });
}

export function signozLogWarn(
  message: string,
  attributes?: Record<string, unknown>
) {
  getApiLogger().emit({
    body: message,
    severityNumber: SeverityNumber.WARN,
    severityText: 'WARN',
    attributes: coerceAttributes(attributes),
  });
}

export function signozLogError(
  message: string,
  attributes?: Record<string, unknown>
) {
  getApiLogger().emit({
    body: message,
    severityNumber: SeverityNumber.ERROR,
    severityText: 'ERROR',
    attributes: coerceAttributes(attributes),
  });
}
