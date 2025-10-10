import type { Address } from "viem";

export type Resource = {
  scheme: string;
  network: string;
  maxAmountRequired: bigint;
  resource: string;
  description: string;
  mimeType: string;
  outputSchema: string;
  payTo: Address;
  maxTimeoutSeconds: number;
  asset: Address;
  extra: string;
};