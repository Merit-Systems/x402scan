import { setCookie } from 'cookies-next/client';

import { COOKIE_KEYS } from './keys';
import type { SelectedResource } from '../types';

export const clientCookieUtils = {
  setSelectedChatModel(model: string | undefined): void {
    setCookie(COOKIE_KEYS.SELECTED_CHAT_MODEL, model);
  },

  setResources(resources: SelectedResource[]): void {
    setCookie(COOKIE_KEYS.RESOURCES, JSON.stringify(resources));
  },
};
