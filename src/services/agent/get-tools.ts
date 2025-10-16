import type { Tool } from 'ai';
import { z } from 'zod3';
import {
  HTTPRequestStructureSchema,
  PaymentRequirementsSchema,
} from 'x402/types';
import type { Signer } from 'x402/types';
import { fetchWithX402Payment } from './fetch';

const FieldDefSchema: z.ZodTypeAny = z.lazy(() =>
  z.preprocess(
    val => {
      // Convert string shorthand to object
      if (typeof val === 'string') {
        return { type: val };
      }
      return val;
    },
    z.object({
      type: z.string().optional(),
      required: z.union([z.boolean(), z.array(z.string())]).optional(),
      description: z.string().optional(),
      enum: z.array(z.string()).optional(),
      properties: z.record(z.lazy(() => FieldDefSchema)).optional(),
      items: z.lazy(() => FieldDefSchema).optional(),
    })
  )
);

const EnhancedOutputSchema = z.object({
  input: HTTPRequestStructureSchema.omit({
    queryParams: true,
    bodyFields: true,
    headerFields: true,
    type: true, // Remove the strict type requirement
  }).extend({
    type: z.string().optional(), // Allow any string type, not just "http"
    queryParams: z.record(FieldDefSchema).optional(),
    bodyFields: z.record(FieldDefSchema).optional(),
    headerFields: z.record(FieldDefSchema).optional(),
  }),
  output: z.record(z.string(), z.any()).optional(),
});
const EnhancedPaymentRequirementsSchema = PaymentRequirementsSchema.extend({
  outputSchema: EnhancedOutputSchema.nullish(),
});

const EnhancedX402ResponseSchema = z.object({
  x402Version: z.number().refine(v => v === 1),
  error: z.string().optional(),
  accepts: z.array(EnhancedPaymentRequirementsSchema).optional(),
  payer: z.string().optional(),
});

const X402OriginSchema = z.object({
  id: z.string().uuid(),
  origin: z.string().url(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  favicon: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  resources: z.array(EnhancedX402ResponseSchema),
  ogImages: z.array(z.unknown()),
});

// TypeScript type
const X402ApiResponseSchema = z.object({
  json: z.array(X402OriginSchema),
});

async function fetchX402Resources() {
  const response = await fetch(
    'https://www.x402scan.com/api/v1/list-resources'
  );
  const data: unknown = await response.json();
  const parsedData = X402ApiResponseSchema.parse(data);
  return parsedData.json;
}

type FieldDef = {
  type?: string;
  required?: boolean | string[];
  description?: string;
  enum?: string[];
  properties?: Record<string, FieldDef>;
  items?: FieldDef;
};

type InputSchema = {
  method: string;
  endpoint?: string;
  queryParams?: Record<string, FieldDef>;
  bodyFields?: Record<string, FieldDef>;
  headerFields?: Record<string, FieldDef>;
};

type OutputSchema = Record<string, unknown>;

interface X402ToolDefinition {
  resource: string;
  description: string;
  inputSchema: InputSchema;
  outputSchema: OutputSchema;
  network: string;
  payTo: string;
  maxAmountRequired: string;
}

function fieldDefToZodType(fieldDef: FieldDef): z.ZodTypeAny {
  let zodType: z.ZodTypeAny;

  if (fieldDef.enum) {
    zodType = z.enum(fieldDef.enum as [string, ...string[]]);
  } else {
    switch (fieldDef.type) {
      case 'number':
      case 'integer':
        zodType = z.number();
        break;
      case 'boolean':
        zodType = z.boolean();
        break;
      case 'object':
        if (fieldDef.properties) {
          const shape: Record<string, z.ZodTypeAny> = {};
          for (const [key, subField] of Object.entries(fieldDef.properties)) {
            shape[key] = fieldDefToZodType(subField);
          }
          zodType = z.object(shape);
        } else {
          zodType = z.record(z.unknown());
        }
        break;
      case 'array':
        if (fieldDef.items) {
          zodType = z.array(fieldDefToZodType(fieldDef.items));
        } else {
          zodType = z.array(z.string());
        }
        break;
      default:
        zodType = z.string();
    }
  }

  if (fieldDef.description) {
    zodType = zodType.describe(fieldDef.description);
  }

  if (!fieldDef.required) {
    zodType = zodType.optional();
  }

  return zodType;
}

function inputSchemaToZodSchema(inputSchema: InputSchema) {
  const method = inputSchema.method.toUpperCase();
  const shape: Record<string, z.ZodTypeAny> = {};

  // For GET/HEAD/OPTIONS: use query params
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    if (inputSchema.queryParams) {
      for (const [key, fieldDef] of Object.entries(inputSchema.queryParams)) {
        shape[key] = fieldDefToZodType(fieldDef);
      }
    }
  }
  // For POST/PUT/PATCH/DELETE: use body fields
  else {
    if (inputSchema.bodyFields) {
      for (const [key, fieldDef] of Object.entries(inputSchema.bodyFields)) {
        shape[key] = fieldDefToZodType(fieldDef);
      }
    }
  }

  return z.object(shape);
}

export async function generateX402Tools(): Promise<X402ToolDefinition[]> {
  const origins = await fetchX402Resources();
  const toolDefinitions: X402ToolDefinition[] = [];

  for (const origin of origins) {
    for (const x402Response of origin.resources) {
      if (x402Response.accepts) {
        for (const accept of x402Response.accepts) {
          if (accept.outputSchema?.input && accept.outputSchema?.output) {
            toolDefinitions.push({
              resource: accept.resource,
              description: accept.description,
              inputSchema: accept.outputSchema.input,
              outputSchema: accept.outputSchema.output,
              network: accept.network,
              payTo: accept.payTo,
              maxAmountRequired: accept.maxAmountRequired,
            });
          }
        }
      }
    }
  }

  return toolDefinitions;
}

export async function createX402AITools(
  walletClient: Signer
): Promise<Record<string, Tool>> {
  const toolDefinitions = await generateX402Tools();
  const aiTools: Record<string, unknown> = {};

  for (const toolDef of toolDefinitions) {
    const urlParts = new URL(toolDef.resource);
    const toolName = urlParts.pathname
      .split('/')
      .filter(Boolean)
      .join('_')
      .replace(/[^a-zA-Z0-9_]/g, '_');

    const parametersSchema = inputSchemaToZodSchema(toolDef.inputSchema);
    const method = toolDef.inputSchema.method.toUpperCase();

    aiTools[toolName] = {
      description: `${toolDef.description} (Paid API - ${toolDef.maxAmountRequired} on ${toolDef.network})`,
      inputSchema: parametersSchema,
      execute: async (params: Record<string, unknown>) => {
        let url = toolDef.resource;
        const requestInit: RequestInit = { method };

        // For GET/HEAD/OPTIONS: append query params to URL
        if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
          const queryParams = new URLSearchParams();
          for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
              if (typeof value === 'object') {
                queryParams.append(key, JSON.stringify(value));
              } else if (typeof value === 'number') {
                queryParams.append(key, String(value));
              } else {
                queryParams.append(key, String(value));
              }
            }
          }
          url = `${toolDef.resource}?${queryParams.toString()}`;
        }
        // For POST/PUT/PATCH/DELETE: send as JSON body
        else {
          requestInit.body = JSON.stringify(params);
          requestInit.headers = { 'Content-Type': 'application/json' };
        }

        console.log(`Calling ${method} ${url}`, params);
        const response = await fetchWithX402Payment(fetch, walletClient)(
          url,
          requestInit
        );
        const data: unknown = await response.json();
        return data;
      },
    };
  }

  return aiTools as Record<string, Tool>;
}
