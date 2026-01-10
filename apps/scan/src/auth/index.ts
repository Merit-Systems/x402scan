import { cache } from 'react';

import NextAuth from 'next-auth';
import { encode as defaultEncode } from 'next-auth/jwt';

import { PrismaAdapter } from '@auth/prisma-adapter';
import { v4 as uuid } from 'uuid';

import { scanDb } from '@x402scan/scan-db';
import { providers } from './providers';

import { SIWE_PROVIDER_ID } from './providers/siwe/constants';
import { SIWS_PROVIDER_ID } from './providers/siws/constants';

import { refreshPermiAccount } from '@/services/permi/refresh-account';

import type { DefaultSession } from 'next-auth';
import type { Account, Role } from '@x402scan/scan-db/types';

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
      let permiAccount = await scanDb.account.findFirst({
        where: {
          provider: 'permi',
          userId: user.id,
        },
      });

      if (permiAccount) {
        permiAccount = await refreshPermiAccount(permiAccount);
      }

      return Promise.resolve({
        ...session,
        user: {
          ...user,
          accounts: [
            ...user.accounts.filter(account => account.provider !== 'permi'),
            ...(permiAccount ? [permiAccount] : []),
          ],
        },
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
