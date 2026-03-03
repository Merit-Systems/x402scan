export interface X402ValidationIssue {
  code: string;
  severity: 'error' | 'warn' | 'info';
  message: string;
  hint?: string;
  path?: string;
  expected?: string;
  actual?: string;
  docsUrl?: string;
  stage?:
    | 'payment_required'
    | 'openapi'
    | 'metadata'
    | 'compat'
    | 'runtime_probe';
}

export function isX402ValidationIssue(value: unknown): value is X402ValidationIssue {
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

export function getValidationIssueMessages(issues: unknown[]): string[] {
  return issues
    .filter(isX402ValidationIssue)
    .map(issue => `${issue.code}: ${issue.message}`);
}
