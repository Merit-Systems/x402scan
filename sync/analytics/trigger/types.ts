import type { Prisma } from '@x402scan/scan-db';

export type SyncConfig = {
  name: string;
  cron: string;
  maxDuration: number;
  machine: 'small-1x' | 'medium-1x' | 'large-2x';
  query: string;
  persist: (data: unknown) => Promise<Prisma.BatchPayload>;
};
