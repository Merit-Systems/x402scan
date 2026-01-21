'use client';

import { getCookie, setCookie, deleteCookie } from 'cookies-next/client';
import { z } from 'zod';

const SOLANA_WALLET_COOKIE_KEY = 'x402scan-solana-wallet';

const solanaWalletCookieSchema = z.object({
  walletName: z.string(),
  address: z.string(),
});

type SolanaWalletCookie = z.infer<typeof solanaWalletCookieSchema>;

export const solanaWalletCookies = {
  get() {
    try {
      const cookie = getCookie(SOLANA_WALLET_COOKIE_KEY);
      if (!cookie) return null;

      const result = solanaWalletCookieSchema.safeParse(JSON.parse(cookie));

      if (!result.success) {
        console.error('Invalid Solana wallet cookie format:', result.error);
        return null;
      }

      return result.data;
    } catch (error) {
      console.error('Failed to parse Solana wallet cookie:', error);
      return null;
    }
  },

  set(data: SolanaWalletCookie) {
    try {
      const validated = solanaWalletCookieSchema.parse(data);
      setCookie(SOLANA_WALLET_COOKIE_KEY, JSON.stringify(validated), {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    } catch (error) {
      console.error('Failed to set Solana wallet cookie:', error);
    }
  },

  clear() {
    try {
      deleteCookie(SOLANA_WALLET_COOKIE_KEY);
    } catch (error) {
      console.error('Failed to clear Solana wallet cookie:', error);
    }
  },
};
