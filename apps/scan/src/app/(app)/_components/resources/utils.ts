import { formatCurrency } from '@/lib/utils';
import { Methods } from '@/types/x402';
import type { Resources } from '@x402scan/scan-db';

/**
 * Parse the min value from a discovery price string like "50-300.00 USD".
 * Returns the numeric min, or 0 if unparseable.
 */
export function parseMinFromPriceString(price: string): number {
  const match = /^(\d+(?:\.\d+)?)\s*-/.exec(price);
  return match?.[1] ? parseFloat(match[1]) : 0;
}

/**
 * Parse the max value from a discovery price string like "50-300.00 USD".
 * Returns the numeric max, or 0 if unparseable.
 */
export function parseMaxFromPriceString(price: string): number {
  const match = /^\d+(?:\.\d+)?\s*-\s*(\d+(?:\.\d+)?)/.exec(price);
  return match?.[1] ? parseFloat(match[1]) : 0;
}

/**
 * Build the display label for a resource's pricing.
 * - Fixed pricing → "$300.00"
 * - Dynamic with range → "$50.00–$300.00"
 * - Dynamic without range → "Up to $300.00"
 */
export function formatPricingLabel(opts: {
  maxAmount: number;
  isDynamic: boolean;
  price?: string;
}): string {
  if (!opts.isDynamic) return formatCurrency(opts.maxAmount);
  const minAmount = opts.price ? parseMinFromPriceString(opts.price) : 0;
  // For dynamic pricing the probed maxAmountRequired may only reflect the
  // minimum request (empty params). Prefer the max from the discovery price
  // string when it's larger.
  const parsedMax = opts.price ? parseMaxFromPriceString(opts.price) : 0;
  const effectiveMax = Math.max(opts.maxAmount, parsedMax);
  if (minAmount > 0) {
    return `${formatCurrency(minAmount)}–${formatCurrency(effectiveMax)}`;
  }
  return `Up to ${formatCurrency(effectiveMax)}`;
}

export function isSiwxResource(resource: Pick<Resources, 'metadata'>): boolean {
  return (
    resource.metadata != null &&
    typeof resource.metadata === 'object' &&
    'authMode' in resource.metadata &&
    resource.metadata.authMode === 'siwx'
  );
}

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
