import { formatCurrency, USDC_ADDRESS } from '@/lib/utils';
import { Methods } from '@/types/x402';
import type { Resources } from '@x402scan/scan-db';

interface PricingAccept {
  maxAmountRequired: number;
  network: string;
  asset?: string | null;
}

const UNKNOWN_PAID_LABEL = 'Paid';

function hasUsdPriceMarker(price: string): boolean {
  return /^\s*\$/.test(price) || /\bUSD\s*$/i.test(price);
}

function parseFinitePriceAmount(value: string | undefined): number {
  if (!value) return 0;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Parse the min value from a discovery price string like "50-300.00 USD".
 * Returns the numeric min, or 0 if unparseable.
 */
export function parseMinFromPriceString(price: string): number {
  const match = /^\s*\$?\s*(\d+(?:\.\d+)?)\s*-/.exec(price);
  return parseFinitePriceAmount(match?.[1]);
}

/**
 * Parse the max value from a discovery price string like "50-300.00 USD".
 * Returns the numeric max, or 0 if unparseable.
 */
export function parseMaxFromPriceString(price: string): number {
  const match = /^\s*\$?\s*\d+(?:\.\d+)?\s*-\s*\$?\s*(\d+(?:\.\d+)?)/.exec(
    price
  );
  return parseFinitePriceAmount(match?.[1]);
}

/**
 * Parse a fixed USD discovery price string like "0.05 USD".
 * Returns null for ranges or ambiguous non-USD values.
 */
export function parseFixedUsdPriceString(price: string): number | null {
  if (!hasUsdPriceMarker(price)) return null;
  const match = /^\s*\$?\s*(\d+(?:\.\d+)?)\s*(?:USD)?\s*$/i.exec(price);
  if (!match?.[1]) return null;
  const value = parseFloat(match[1]);
  return Number.isFinite(value) ? value : null;
}

export function isKnownUsdcAccept(accept: PricingAccept): boolean {
  if (!accept.asset) return false;
  if (accept.network === 'base') {
    return accept.asset.toLowerCase() === USDC_ADDRESS.base;
  }
  if (accept.network === 'solana') {
    return accept.asset === USDC_ADDRESS.solana;
  }
  return false;
}

export function getMaxUsdcAmount(accepts: PricingAccept[]): number | null {
  const usdcAmounts = accepts
    .filter(isKnownUsdcAccept)
    .map(a => a.maxAmountRequired)
    .filter(Number.isFinite);
  if (usdcAmounts.length === 0) return null;
  return Math.max(...usdcAmounts);
}

/**
 * Build the display label for a resource's pricing.
 * - Fixed pricing → "$300.00"
 * - Dynamic with range → "$50.00–$300.00"
 * - Dynamic without range → "Up to $300.00"
 */
export function formatPricingLabel(opts: {
  maxUsdAmount?: number | null;
  isDynamic: boolean;
  price?: string;
}): string {
  if (!opts.isDynamic) {
    const fixedUsdAmount = opts.price
      ? parseFixedUsdPriceString(opts.price)
      : null;
    if (fixedUsdAmount !== null) return formatCurrency(fixedUsdAmount);
    if (opts.maxUsdAmount != null) return formatCurrency(opts.maxUsdAmount);
    return UNKNOWN_PAID_LABEL;
  }
  const hasUsdPrice = opts.price ? hasUsdPriceMarker(opts.price) : false;
  const minAmount =
    opts.price && hasUsdPrice ? parseMinFromPriceString(opts.price) : 0;
  // For dynamic pricing the probed maxAmountRequired may only reflect the
  // minimum request (empty params). Prefer the max from the discovery price
  // string when it's larger.
  const parsedMax =
    opts.price && hasUsdPrice ? parseMaxFromPriceString(opts.price) : 0;
  const effectiveMax =
    opts.maxUsdAmount != null
      ? Math.max(opts.maxUsdAmount, parsedMax)
      : parsedMax;
  if (minAmount > 0 && effectiveMax > 0) {
    return `${formatCurrency(minAmount)}–${formatCurrency(effectiveMax)}`;
  }
  if (effectiveMax > 0) {
    return `Up to ${formatCurrency(effectiveMax)}`;
  }
  return UNKNOWN_PAID_LABEL;
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
