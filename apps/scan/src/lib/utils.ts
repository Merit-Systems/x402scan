import { twMerge } from 'tailwind-merge';

import { Chain } from '@/types/chain';
import { clsx, type ClassValue } from 'clsx';
import { formatDistanceToNow, formatISO } from 'date-fns';

import type { Message } from '@x402scan/scan-db/types';
import type { UIDataTypes, UIMessage, UIMessagePart, UITools } from 'ai';
import type { MixedAddress, SolanaAddress } from '@/types/address';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (
  value: number,
  options?: Intl.NumberFormatOptions
): string => {
  if (value < 0.01 && value > 0) {
    return '< $0.01';
  }

  return value.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  });
};

interface FormatCompactAgoOptions {
  addSuffix?: boolean;
  suffix?: string;
  allowFuture?: boolean;
}

export const formatCompactAgo = (
  date: Date,
  options?: FormatCompactAgoOptions
) => {
  const target =
    !options?.allowFuture && date.getTime() > Date.now() ? new Date() : date;
  const str = formatDistanceToNow(target, {
    addSuffix: options?.addSuffix ?? true,
  });
  const formatted = str
    .replace('less than ', '< ')
    .replace('a ', '1 ')
    .replace('about ', '~')
    .replace(' hours', 'h')
    .replace(' hour', 'h')
    .replace(' minutes', 'm')
    .replace(' minute', 'm')
    .replace(' seconds', 's')
    .replace(' second', 's')
    .replace(' days', 'd')
    .replace(' day', 'd')
    .replace(' weeks', 'w')
    .replace(' week', 'w')
    .replace(' months', 'M')
    .replace(' month', 'M')
    .replace(' years', 'y')
    .replace(' year', 'y');

  if (options?.suffix) {
    return `${formatted} ${options.suffix}`;
  }

  return formatted;
};

export const formatAddress = (address: string) => {
  return address.slice(0, 6) + '...' + address.slice(-6);
};

export const addressTextClassName =
  'font-mono [font-feature-settings:"liga"_0,"calt"_0] [font-variant-ligatures:none]';

export function convertToUIMessages(messages: Message[]): UIMessage[] {
  return messages.map(message => ({
    id: message.id,
    role: message.role as 'user' | 'assistant' | 'system',
    parts: JSON.parse(message.parts as string) as UIMessagePart<
      UIDataTypes,
      UITools
    >[],
    metadata: {
      createdAt: formatISO(message.createdAt),
    },
  }));
}
export const USDC_ADDRESS = {
  [Chain.BASE]: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' as const,
  [Chain.SOLANA]:
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' as SolanaAddress,
  [Chain.POLYGON]: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359' as const,
  [Chain.OPTIMISM]: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85' as const,
} satisfies Record<Chain, MixedAddress>;

const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
};

const ENTITY_PATTERN = /&(?:amp|lt|gt|quot|#39|apos|#x[0-9a-fA-F]+|#\d+);/g;

export const decodeHtmlEntities = (str: string): string =>
  str.replace(ENTITY_PATTERN, match => {
    if (match in HTML_ENTITIES) return HTML_ENTITIES[match]!;
    if (match.startsWith('&#x'))
      return String.fromCodePoint(parseInt(match.slice(3, -1), 16));
    if (match.startsWith('&#'))
      return String.fromCodePoint(parseInt(match.slice(2, -1), 10));
    return match;
  });

/**
 * Repairs UTF-8 mojibake — text where UTF-8 bytes were decoded as Latin-1.
 * e.g. "Â·" → "·", "â€"" → "—"
 *
 * Re-encodes the string as Latin-1 bytes and decodes as UTF-8. Falls back
 * to the original string when the result isn't valid UTF-8 or the input
 * contains characters outside the Latin-1 range.
 */
export const repairMojibake = (str: string): string => {
  if (!/[\u0080-\u00ff]/.test(str)) return str;
  try {
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code > 0xff) return str;
      bytes[i] = code;
    }
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return str;
  }
};

/**
 * Cleans a description from an external source by repairing mojibake
 * and decoding HTML entities. Use for any user-facing description that
 * originates from scraped HTML or x402 response data.
 */
export const cleanExternalText = (str: string): string =>
  decodeHtmlEntities(repairMojibake(str));

export const truncateAtDelimiter = (text: string): string =>
  (text.split(/\s*[—–:|]\s*|\s+-\s+/)[0] ?? text).trim();

export const safeParseJson = <T>(
  value: string | null | undefined,
  fallback: T
): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(decodeURIComponent(value)) as T;
  } catch (e) {
    console.error('Failed to parse JSON from cookie value:', e);
    return fallback;
  }
};
