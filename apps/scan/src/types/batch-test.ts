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
  error: string;
  issues?: AuditWarning[];
}
