import dns from 'dns';

import { parseDnsTxtRecord } from '@/lib/x402/discovery-schema';

import type { X402DnsLookupResult, X402DnsTxtRecord } from '@/types/discovery';

/**
 * Look up x402 discovery TXT records for a hostname.
 * Checks _x402.{hostname} for TXT records containing discovery URLs.
 *
 * @param hostname - The hostname to look up (e.g., "api.example.com")
 * @returns Discovery URLs found in DNS TXT records
 */
export async function lookupX402TxtRecord(
  hostname: string
): Promise<X402DnsLookupResult> {
  const txtRecordName = `_x402.${hostname}`;

  try {
    const records = await lookupTxtRecords(txtRecordName);
    return parseRecords(records);
  } catch (error) {
    // ENODATA or ENOTFOUND means no TXT record exists - not an error
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENODATA' || code === 'ENOTFOUND') {
      return { found: false, records: [] };
    }

    return {
      found: false,
      records: [],
      error: error instanceof Error ? error.message : 'DNS lookup failed',
    };
  }
}

/**
 * Look up TXT records using Node.js dns module.
 */
async function lookupTxtRecords(name: string): Promise<string[]> {
  const records = await dns.promises.resolveTxt(name);
  // TXT records come as arrays of strings, join each record's parts
  return records.map(parts => parts.join(''));
}

/**
 * Parse raw TXT record strings into structured x402 records.
 */
function parseRecords(rawRecords: string[]): X402DnsLookupResult {
  const validRecords: X402DnsTxtRecord[] = [];

  for (const raw of rawRecords) {
    const parsed = parseDnsTxtRecord(raw);
    if (parsed) {
      validRecords.push(parsed);
    }
  }

  return {
    found: validRecords.length > 0,
    records: validRecords,
  };
}

