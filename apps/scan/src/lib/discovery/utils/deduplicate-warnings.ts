import type { AuditWarning } from '@agentcash/discovery';

/** Deduplicate warnings by code + message, preserving order. */
export function deduplicateWarnings(warnings: AuditWarning[]): AuditWarning[] {
  const seen = new Set<string>();
  return warnings.filter(w => {
    const key = `${w.code}:${w.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
