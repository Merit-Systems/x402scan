import { Methods } from '@/types/x402';

export function getBazaarMethod(outputSchema: unknown): Methods {
  if (
    typeof outputSchema === 'object' &&
    outputSchema &&
    'input' in outputSchema
  ) {
    const input = (outputSchema as { input: { method: Methods } }).input;
    if (typeof input === 'object' && input && 'method' in input) {
      return (input as { method: Methods }).method;
    }
  }
  return Methods.GET;
}
