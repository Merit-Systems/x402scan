import { getTimeRangeFromTimeframe } from '@/lib/time-range';

import type z from 'zod';
import type { baseQuerySchema } from './schemas';

export const transfersWhereClause = (
  input: z.infer<typeof baseQuerySchema>
): string => {
  const { chain, timeframe, senders, recipients, facilitatorIds } = input;

  const { startDate, endDate } = getTimeRangeFromTimeframe(timeframe);

  const conditions: string[] = ['1=1'];

  if (chain) {
    conditions.push(`chain = '${chain}'`);
  }

  if (startDate) {
    conditions.push(
      `block_timestamp >= parseDateTime64BestEffort('${startDate.toISOString()}')`
    );
  }

  if (endDate) {
    conditions.push(
      `block_timestamp <= parseDateTime64BestEffort('${endDate.toISOString()}')`
    );
  }

  if (recipients?.include !== undefined && recipients.include.length > 0) {
    const recipientList = recipients.include.map(r => `'${r}'`).join(', ');
    conditions.push(`recipient IN (${recipientList})`);
  }

  if (recipients?.exclude !== undefined && recipients.exclude.length > 0) {
    const recipientList = recipients.exclude.map(r => `'${r}'`).join(', ');
    conditions.push(`recipient NOT IN (${recipientList})`);
  }

  if (senders?.include !== undefined && senders.include.length > 0) {
    const senderList = senders.include.map(s => `'${s}'`).join(', ');
    conditions.push(`sender IN (${senderList})`);
  }

  if (senders?.exclude !== undefined && senders.exclude.length > 0) {
    const senderList = senders.exclude.map(s => `'${s}'`).join(', ');
    conditions.push(`sender NOT IN (${senderList})`);
  }

  if (facilitatorIds && facilitatorIds.length > 0) {
    const facilitatorList = facilitatorIds.map(f => `'${f}'`).join(', ');
    conditions.push(`facilitator_id IN (${facilitatorList})`);
  }

  return 'WHERE ' + conditions.join(' AND ');
};
