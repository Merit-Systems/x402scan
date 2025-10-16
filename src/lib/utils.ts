import type { Message } from '@prisma/client';
import type { UIDataTypes, UIMessage, UIMessagePart, UITools } from 'ai';
import { clsx, type ClassValue } from 'clsx';
import { formatDistanceToNow, formatISO } from 'date-fns';
import { twMerge } from 'tailwind-merge';

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

export const formatCompactAgo = (date: Date) => {
  const str = formatDistanceToNow(date, {
    addSuffix: true,
  });
  return str
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
};

export const formatAddress = (address: string) => {
  return address.slice(0, 6) + '...' + address.slice(-6);
};

export const getPercentageFromBigInt = (previous: bigint, current: bigint) => {
  return ((Number(current) - Number(previous)) / Number(previous)) * 100;
};

export const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

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
