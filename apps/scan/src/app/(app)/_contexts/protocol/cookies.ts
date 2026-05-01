'use client';

import { setCookie, getCookie } from 'cookies-next/client';

import { parseProtocol, PROTOCOL_COOKIE_KEY } from './keys';

import type { SearchProtocol } from '@/features/search-box';

export const setProtocolCookieClient = (
  protocol: SearchProtocol | undefined
): void => {
  setCookie(PROTOCOL_COOKIE_KEY, protocol);
};

export const getProtocolCookieClient = (): SearchProtocol | undefined =>
  parseProtocol(getCookie(PROTOCOL_COOKIE_KEY));
