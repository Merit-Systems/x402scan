import type {
  EndpointMethodAdvisory,
  AuditWarning,
} from '@agentcash/discovery';

import type { DiscoveryError } from '@/lib/discovery/errors';

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
  /** Full serialized DiscoveryError carrying `_tag` and the variant payload. */
  error: DiscoveryError;
  issues?: AuditWarning[];
}
