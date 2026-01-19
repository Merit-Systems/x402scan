import { getOutputSchema, normalizeAccepts, parseX402Response } from '.';
import type { ParsedX402Response } from '.';

export type ParsedX402ResponseWithAccepts = ParsedX402Response & {
  accepts: NonNullable<ParsedX402Response['accepts']>;
};

export interface X402ScanValidationSuccess {
  success: true;
  parsed: ParsedX402ResponseWithAccepts;
  normalizedAccepts: ReturnType<typeof normalizeAccepts>;
  outputSchema: NonNullable<ReturnType<typeof getOutputSchema>>;
}

export interface X402ScanValidationFailure {
  success: false;
  errors: string[];
}

export type X402ScanValidationResult =
  | X402ScanValidationSuccess
  | X402ScanValidationFailure;

export function validateX402(data: unknown): X402ScanValidationResult {
  const parsed = parseX402Response(data);
  if (!parsed.success) {
    return { success: false, errors: parsed.errors };
  }

  const x402 = parsed.data;

  if (!x402.accepts?.length) {
    return {
      success: false,
      errors: ['Accepts must contain at least one valid payment requirement'],
    };
  }

  const outputSchema = getOutputSchema(x402);
  if (!outputSchema?.input) {
    return { success: false, errors: ['Missing input schema'] };
  }

  const withAccepts = x402 as ParsedX402ResponseWithAccepts;
  return {
    success: true,
    parsed: withAccepts,
    normalizedAccepts: normalizeAccepts(withAccepts),
    outputSchema,
  };
}
