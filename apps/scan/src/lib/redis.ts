import Redis from 'ioredis';
import { env } from '@/env';

/**
 * Redis client singleton for distributed caching
 */
let redis: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (!env.REDIS_URL) {
    return null;
  }

  if (!redis) {
    try {
      redis = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy: times => {
          if (times > 3) {
            console.error('[Redis] Max retries reached, giving up');
            return null;
          }
          const delay = Math.min(times * 100, 2000);
          return delay;
        },
        reconnectOnError: err => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            return true;
          }
          return false;
        },
      });

      redis.on('error', err => {
        console.error('[Redis] Connection error:', err.message);
      });

      redis.on('connect', () => {
        console.log('[Redis] Connected successfully');
      });
    } catch (err) {
      console.error('[Redis] Failed to initialize:', err);
      redis = null;
    }
  }

  return redis;
}
