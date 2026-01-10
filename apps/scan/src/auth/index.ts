import { cache } from 'react';

import NextAuth from 'next-auth';
import { encode as defaultEncode } from 'next-auth/jwt';

import { PrismaAdapter } from '@auth/prisma-adapter';
import { v4 as uuid } from 'uuid';

import { scanDb } from '@x402scan/scan-db';
import { providers } from './providers';

import { SIWE_PROVIDER_ID } from './providers/siwe/constants';
import { SIWS_PROVIDER_ID } from './providers/siws/constants';

import type { DefaultSession } from 'next-auth';
import type { Account, Role } from '@x402scan/scan-db/types';
import { env } from '@/env';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      accounts: Account[];
    } & DefaultSession['user'];
  }

  interface AdapterUser {
    id: string;
    email: string | null;
    role: Role;
    accounts: Account[];
  }

  interface User {
    id?: string;
    email?: string | null;
    accounts: Account[];
  }
}

const {
  handlers,
  auth: uncachedAuth,
  signIn,
} = NextAuth({
  providers,
  adapter: {
    ...PrismaAdapter(scanDb as Parameters<typeof PrismaAdapter>[0]),
    getUser: async id => {
      const user = await scanDb.user.findUnique({
        where: { id },
        include: { accounts: true },
      });
      if (!user) {
        return null;
      }
      return {
        ...user,
        email: user?.email ?? '',
      };
    },
    getSessionAndUser: async sessionToken => {
      const session = await scanDb.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      });
      if (!session) {
        return null;
      }
      const user = await scanDb.user.findUnique({
        where: { id: session.userId },
        include: { accounts: true },
      });
      if (!user) {
        return null;
      }
      return {
        session,
        user: {
          ...user,
          email: user.email ?? '',
        },
      };
    },
  },
  trustHost: true,
  callbacks: {
    async session({ session, user }) {
      const permiAccount = await scanDb.account.findFirst({
        where: {
          provider: 'permi',
          userId: user.id,
        },
      });
      if (
        permiAccount?.expires_at &&
        permiAccount.expires_at * 1000 < Date.now()
      ) {
        try {
          const response = await fetch(
            'https://www.permi.xyz/api/oauth/token',
            {
              method: 'POST',
              body: new URLSearchParams({
                client_id: env.PERMI_APP_ID,
                grant_type: 'refresh_token',
                refresh_token: permiAccount.refresh_token!,
              }),
            }
          );
          const tokensOrError = (await response.json()) as unknown;

          if (!response.ok) throw tokensOrError;

          const newTokens = tokensOrError as {
            access_token: string;
            expires_in: number;
            refresh_token?: string;
          };

          const updatedAccount = await scanDb.account.update({
            where: {
              provider_providerAccountId: {
                provider: 'permi',
                providerAccountId: permiAccount.providerAccountId,
              },
            },
            data: {
              access_token: newTokens.access_token,
              expires_at: newTokens.expires_in,
              refresh_token: newTokens.refresh_token,
            },
          });
          if (!updatedAccount) {
            throw new Error('Failed to update account');
          }
          user.accounts = [
            ...user.accounts.filter(account => account.provider !== 'permi'),
            updatedAccount,
          ];
        } catch (error) {
          console.error('Error refreshing access_token', error);
        }
      }
      return Promise.resolve({
        ...session,
        user: user,
      });
    },
    async jwt({ token, account }) {
      if (
        account?.provider === SIWE_PROVIDER_ID ||
        account?.provider === SIWS_PROVIDER_ID
      ) {
        token.credentials = true;
      }
      return Promise.resolve(token);
    },
  },
  jwt: {
    encode: async function (params) {
      if (params.token?.credentials) {
        const sessionToken = uuid();

        if (!params.token.sub) {
          throw new Error('No user ID found in token');
        }

        const createdSession = await scanDb.session.create({
          data: {
            sessionToken: sessionToken.toString(),
            userId: params.token.sub,
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        });

        if (!createdSession) {
          throw new Error('Failed to create session');
        }

        return sessionToken;
      }
      return defaultEncode(params);
    },
  },
});

const auth = cache(uncachedAuth);

export { handlers, auth, signIn };
