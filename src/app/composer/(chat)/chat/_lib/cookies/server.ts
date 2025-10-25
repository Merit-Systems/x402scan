import { cookies } from 'next/headers';

import { COOKIE_KEYS } from './keys';

import type { ChatConfig } from '../../../_types/chat-config';

const safeParseJson = <T>(value: string | null | undefined, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(decodeURIComponent(value)) as T;
  } catch (e) {
    console.error('Failed to parse JSON from cookie value:', e);
    return fallback;
  }
};

export const serverCookieUtils = {
  async getConfig(): Promise<ChatConfig> {
    try {
      const cookieStore = await cookies();

      return {
        model: cookieStore.get(COOKIE_KEYS.SELECTED_CHAT_MODEL)?.value,
        resources: safeParseJson(
          cookieStore.get(COOKIE_KEYS.RESOURCES)?.value,
          []
        ),
      };
    } catch (error) {
      console.warn('Failed to read cookies:', error);
      return {};
    }
  },
};
