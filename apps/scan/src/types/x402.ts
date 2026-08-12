import type { JsonObject } from '@/lib/json';

export enum Methods {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

export interface FieldDefinition {
  name: string;
  type?: string;
  description?: string;
  required?: boolean;
  enum?: string[];
  default?: string;
  items?: {
    type?: string;
    properties?: JsonObject;
    required?: string[];
  };
}
