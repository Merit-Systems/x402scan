import { Methods } from '@/types/x402';

export function getBazaarMethod(outputSchema: unknown): Methods {
  if (
    typeof outputSchema === 'object' &&
    outputSchema &&
    'input' in outputSchema
  ) {
    const input = (
      outputSchema as { input: { method?: Methods; body?: unknown } }
    ).input;
    if (typeof input === 'object' && input) {
      const inputObj = input as Record<string, unknown>;

      // Check explicit method first
      if ('method' in inputObj && inputObj.method) {
        return (input.method as string).toUpperCase() as Methods;
      }

      // Infer POST if body exists (V2 bazaar schema uses type: "http" instead of method)
      if ('body' in inputObj && inputObj.body) {
        return Methods.POST;
      }

      // V1 output schema uses `bodyFields` instead of `body`
      if ('bodyFields' in inputObj && inputObj.bodyFields) {
        return Methods.POST;
      }

      // If query params are explicitly described, assume GET
      if ('queryParams' in inputObj && inputObj.queryParams) {
        return Methods.GET;
      }

      // Some bazaar `info.input` shapes are "flattened": the input object is
      // the actual payload fields (no `body` / `bodyFields` wrapper). In that case,
      // treat it as a request body and infer POST.
      const reservedKeys = new Set([
        'method',
        'body',
        'bodyFields',
        'queryParams',
        'headerFields',
        'headers',
        'pathParams',
        'params',
      ]);
      const nonReservedKeys = Object.keys(inputObj).filter(
        k => !reservedKeys.has(k)
      );
      if (nonReservedKeys.length > 0) {
        return Methods.POST;
      }
    }
  }
  return Methods.GET;
}
