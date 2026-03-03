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
