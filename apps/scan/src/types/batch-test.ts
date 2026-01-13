import type { ParsedX402Response } from '@/lib/x402';

export interface TestedResource {
  success: true;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  description: string | null;
  parsed: ParsedX402Response;
}

export interface FailedResource {
  success: false;
  url: string;
  error: string;
  status?: number;
  statusText?: string;
  body?: unknown;
}
