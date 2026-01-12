import type { OutputSchemaV1 } from '../v1';

type BazaarSchema = {
  properties?: { input?: { properties?: { body?: Record<string, unknown> } } };
};

export function extractBazaarInfo(
  info: OutputSchemaV1,
  schema: unknown
): OutputSchemaV1 {
  const input = info.input;

  const bodyNeedsSchema =
    !input ||
    !('body' in input) ||
    !input.body ||
    typeof input.body !== 'object' ||
    !('properties' in input.body);

  if (!bodyNeedsSchema || !schema) {
    return info;
  }

  const bodySchema = (schema as BazaarSchema).properties?.input?.properties
    ?.body;
  if (bodySchema && 'properties' in bodySchema) {
    return {
      ...info,
      input: { ...input, body: bodySchema },
    } as OutputSchemaV1;
  }

  return info;
}
