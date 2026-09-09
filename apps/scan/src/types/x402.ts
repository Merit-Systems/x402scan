import type { JsonObject } from "@/lib/json";

export enum Methods {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  PATCH = "PATCH",
}

/**
 * HTTP methods a stored bazaar/v1 output schema can carry. Registration
 * (v1HttpMethodSchema) also accepts OPTIONS and HEAD, which are displayed
 * but have no dedicated UI treatment in the Methods enum.
 */
export type BazaarMethod = Methods | "OPTIONS" | "HEAD";

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
