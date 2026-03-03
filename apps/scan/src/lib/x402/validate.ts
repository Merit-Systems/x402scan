import { getOutputSchema, normalizeAccepts, parseX402Response } from '.';
import type { ParsedX402Response } from '.';
import * as discoveryPackage from '@agentcash/discovery';
import type { X402ValidationIssue } from '@/types/validation';

export type ParsedX402ResponseWithAccepts = ParsedX402Response & {
  accepts: NonNullable<ParsedX402Response['accepts']>;
};

interface X402ScanValidationSuccess {
  success: true;
  parsed: ParsedX402ResponseWithAccepts;
  normalizedAccepts: ReturnType<typeof normalizeAccepts>;
  outputSchema: NonNullable<ReturnType<typeof getOutputSchema>>;
  issues: X402ValidationIssue[];
}

interface X402ScanValidationFailure {
  success: false;
  errors: string[];
  issues: X402ValidationIssue[];
}

export type X402ScanValidationResult =
  | X402ScanValidationSuccess
  | X402ScanValidationFailure;

interface DiscoveryValidationResult {
  issues: X402ValidationIssue[];
}

type DiscoveryValidateFn = (
  payload: unknown,
  options?: {
    compatMode?: 'on' | 'off' | 'strict';
    requireInputSchema?: boolean;
    requireOutputSchema?: boolean;
  }
) => { valid: boolean; issues: unknown[] };

function isValidationIssue(value: unknown): value is X402ValidationIssue {
  if (!value || typeof value !== 'object') return false;
  const issue = value as Partial<X402ValidationIssue>;
  return (
    typeof issue.code === 'string' &&
    typeof issue.message === 'string' &&
    (issue.severity === 'error' ||
      issue.severity === 'warn' ||
      issue.severity === 'info')
  );
}

function runDiscoveryValidation(data: unknown): DiscoveryValidationResult | null {
  const validate = (
    discoveryPackage as unknown as {
      validatePaymentRequiredDetailed?: DiscoveryValidateFn;
    }
  ).validatePaymentRequiredDetailed;

  if (typeof validate !== 'function') {
    return null;
  }

  try {
    const result = validate(data, {
      compatMode: 'strict',
      requireInputSchema: true,
      // Treat output schema as required for scan ingestion quality.
      requireOutputSchema: true,
    });
    const issues = Array.isArray(result.issues)
      ? result.issues.filter(isValidationIssue)
      : [];

    return {
      issues,
    };
  } catch {
    return null;
  }
}

function toLegacyErrors(
  parseErrors: string[],
  issues: X402ValidationIssue[]
): string[] {
  const issueErrors = issues
    .filter(issue => issue.severity === 'error')
    .map(issue =>
      issue.path && issue.path !== '$'
        ? `${issue.code}: ${issue.path}: ${issue.message}`
        : `${issue.code}: ${issue.message}`
    );

  return [...new Set([...parseErrors, ...issueErrors])];
}

export function validateX402(data: unknown): X402ScanValidationResult {
  const discoveryValidation = runDiscoveryValidation(data);

  const parsed = parseX402Response(data);
  if (!parsed.success) {
    return {
      success: false,
      errors: toLegacyErrors(parsed.errors, discoveryValidation?.issues ?? []),
      issues: discoveryValidation?.issues ?? [],
    };
  }

  const x402 = parsed.data;
  const discoveryIssues = discoveryValidation?.issues ?? [];

  if (!x402.accepts?.length) {
    return {
      success: false,
      errors: toLegacyErrors(
        ['Accepts must contain at least one valid payment requirement'],
        discoveryIssues
      ),
      issues: discoveryIssues,
    };
  }

  const outputSchema = getOutputSchema(x402);
  if (!outputSchema?.input) {
    return {
      success: false,
      errors: toLegacyErrors(['Missing input schema'], discoveryIssues),
      issues: discoveryIssues,
    };
  }

  const discoveryErrors = discoveryIssues.filter(
    issue => issue.severity === 'error'
  );
  if (discoveryErrors.length > 0) {
    return {
      success: false,
      errors: toLegacyErrors([], discoveryIssues),
      issues: discoveryIssues,
    };
  }

  const withAccepts = x402 as ParsedX402ResponseWithAccepts;
  return {
    success: true,
    parsed: withAccepts,
    normalizedAccepts: normalizeAccepts(withAccepts),
    outputSchema,
    issues: discoveryIssues,
  };
}
