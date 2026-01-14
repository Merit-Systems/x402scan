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
      // Check explicit method first
      if ('method' in input && input.method) {
        return (input.method as string).toUpperCase() as Methods;
      }
      // Infer POST if body exists (V2 bazaar schema uses type: "http" instead of method)
      if ('body' in input && input.body) {
        return Methods.POST;
      }
    }
  }
  return Methods.GET;
}
