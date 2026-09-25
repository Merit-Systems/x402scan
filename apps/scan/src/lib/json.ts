import { z } from "zod";

/**
 * The JSON value domain: what any JSON.parse result or JSON-serializable
 * payload can be. Use these instead of `Record<string, unknown>` when data is
 * genuinely arbitrary JSON, and parse external input through the schemas at
 * the I/O boundary.
 */
export const jsonValueSchema = z.json();
export type JsonValue = z.infer<typeof jsonValueSchema>;

export const jsonObjectSchema = z.record(z.string(), jsonValueSchema);
export type JsonObject = z.infer<typeof jsonObjectSchema>;
