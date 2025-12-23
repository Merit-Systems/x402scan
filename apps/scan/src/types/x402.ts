export enum Methods {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

export type FieldValue = string | unknown[] | Record<string, unknown>;

export type FieldDefinition = {
  name: string;
  type?: string;
  description?: string;
  required?: boolean;
  enum?: string[];
  default?: string;
  items?: {
    type?: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
  properties?: Record<string, unknown>; // For object types
  propertiesRequired?: string[]; // Required properties within the object
};
