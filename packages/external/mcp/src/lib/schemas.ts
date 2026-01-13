import z from "zod";

import { getAddress, Hex } from "viem";

export const ethereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address")
  .transform((address) => getAddress(address));

export const ethereumPrivateKeySchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid Ethereum private key")
  .transform((privateKey) => privateKey as Hex);

export const requestSchema = z.object({
  url: z.string().url().describe("The endpoint URL"),
  method: z
    .enum(["GET", "POST", "PUT", "DELETE", "PATCH"])
    .default("GET")
    .describe("HTTP method"),
  body: z
    .unknown()
    .optional()
    .describe("Request body for POST/PUT/PATCH methods"),
});

export const requestWithHeadersSchema = requestSchema.extend({
  headers: z
    .record(z.string())
    .optional()
    .describe("Additional headers to include")
    .default({}),
});

export type Request = z.infer<typeof requestSchema>;
export type RequestWithHeaders = z.infer<typeof requestWithHeadersSchema>;
