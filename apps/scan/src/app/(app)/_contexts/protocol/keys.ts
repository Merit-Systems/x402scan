import type { SearchProtocol } from '@/features/search-box';

export const PROTOCOL_COOKIE_KEY = 'x402scan-protocol';

export const SEARCH_PROTOCOLS: readonly SearchProtocol[] = ['x402', 'mpp'];

export const parseProtocol = (
  value: string | undefined | null
): SearchProtocol | undefined =>
  SEARCH_PROTOCOLS.includes(value as SearchProtocol)
    ? (value as SearchProtocol)
    : undefined;
