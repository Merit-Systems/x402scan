import { z } from 'zod';
import type { JSONValue } from 'ai';

// SharedV2ProviderMetadata is Record<string, Record<string, JSONValue>>
const providerMetadataSchema = z.record(
  z.string(),
  z.record(z.string(), z.custom<JSONValue>())
);

// --- Message "part" types matching AI SDK UIMessagePart structure ---

const textPartSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
  state: z.optional(z.enum(['streaming', 'done'])),
  providerMetadata: z.optional(providerMetadataSchema),
});

const reasoningPartSchema = z.object({
  type: z.literal('reasoning'),
  text: z.string(),
  state: z.optional(z.enum(['streaming', 'done'])),
  providerMetadata: z.optional(providerMetadataSchema),
});

const toolStateSchema = z.union([
  z.object({
    state: z.literal('input-streaming'),
    input: z.unknown(),
    providerExecuted: z.optional(z.boolean()),
  }),
  z.object({
    state: z.literal('input-available'),
    input: z.unknown(),
    providerExecuted: z.optional(z.boolean()),
    callProviderMetadata: z.optional(providerMetadataSchema),
  }),
  z.object({
    state: z.literal('output-available'),
    input: z.unknown(),
    output: z.unknown(),
    providerExecuted: z.optional(z.boolean()),
    callProviderMetadata: z.optional(providerMetadataSchema),
    preliminary: z.optional(z.boolean()),
  }),
  z.object({
    state: z.literal('output-error'),
    input: z.unknown(),
    rawInput: z.optional(z.unknown()),
    errorText: z.string(),
    providerExecuted: z.optional(z.boolean()),
    callProviderMetadata: z.optional(providerMetadataSchema),
  }),
]);

const toolPartSchema = z.intersection(
  z.object({
    type: z.custom<`tool-${string}`>(
      val => typeof val === 'string' && val.startsWith('tool-')
    ),
    toolCallId: z.string(),
  }),
  toolStateSchema
);

const dynamicToolPartSchema = z.intersection(
  z.object({
    type: z.literal('dynamic-tool'),
    toolName: z.string(),
    toolCallId: z.string(),
  }),
  toolStateSchema
);

const sourceUrlPartSchema = z.object({
  type: z.literal('source-url'),
  sourceId: z.string(),
  url: z.string(),
  title: z.optional(z.string()),
  providerMetadata: z.optional(providerMetadataSchema),
});

const sourceDocumentPartSchema = z.object({
  type: z.literal('source-document'),
  sourceId: z.string(),
  mediaType: z.string(),
  title: z.string(),
  filename: z.optional(z.string()),
  providerMetadata: z.optional(providerMetadataSchema),
});

const filePartSchema = z.object({
  type: z.literal('file'),
  mediaType: z.string(),
  filename: z.optional(z.string()),
  url: z.string(),
  providerMetadata: z.optional(providerMetadataSchema),
});

const dataPartSchema = z.object({
  type: z.custom<`data-${string}`>(
    val => typeof val === 'string' && val.startsWith('data-')
  ),
  id: z.optional(z.string()),
  data: z.unknown(),
});

const stepStartPartSchema = z.object({
  type: z.literal('step-start'),
});

const messagePartSchema = z.union([
  textPartSchema,
  reasoningPartSchema,
  toolPartSchema,
  dynamicToolPartSchema,
  sourceUrlPartSchema,
  sourceDocumentPartSchema,
  filePartSchema,
  dataPartSchema,
  stepStartPartSchema,
]);

export const messageSchema = z.object({
  id: z.string(),
  role: z.enum(['system', 'user', 'assistant']),
  metadata: z.optional(z.unknown()),
  parts: z.array(messagePartSchema),
});
