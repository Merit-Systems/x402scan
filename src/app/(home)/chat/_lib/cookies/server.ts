import { cookies } from 'next/headers';
import type { ChatPreferences } from '../types';
import { COOKIE_KEYS } from './keys';

// Helper to safely parse JSON from cookie value
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
  async getPreferences(): Promise<ChatPreferences> {
    try {
      const cookieStore = await cookies();

      return {
        selectedChatModel: cookieStore.get(COOKIE_KEYS.SELECTED_CHAT_MODEL)
          ?.value,
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
