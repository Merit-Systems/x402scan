import type {
  EndpointMethodAdvisory,
  AuditWarning,
} from '@agentcash/discovery';

export interface TestedResource {
  success: true;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  description: string | null;
  parsed: EndpointMethodAdvisory;
  warnings: AuditWarning[];
}

export interface FailedResource {
  success: false;
  url: string;
  method?: string;
  error: string;
  issues?: AuditWarning[];
  /** True when the endpoint was reachable but not x402-paid — a skip, not a hard probe failure. */
  skipped?: boolean;
  /** HTTP status code from the probe attempt, when available. */
  statusCode?: number;
}
