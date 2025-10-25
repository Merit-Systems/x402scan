import { cache } from 'react';

import NextAuth from 'next-auth';
import { encode as defaultEncode } from 'next-auth/jwt';

import { PrismaAdapter } from '@auth/prisma-adapter';
import { v4 as uuid } from 'uuid';

import { prisma } from '../services/db/client';
import { providers } from './providers';

import type { DefaultSession } from 'next-auth';
import type { Account, Role } from '@prisma/client';

declare module 'next-auth' {
  interface Session extends DefaultSession {
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

const { handlers, auth: uncachedAuth } = NextAuth({
  providers,
  adapter: {
    ...PrismaAdapter(prisma),
    getUser: async id => {
      const user = await prisma.user.findUnique({
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
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      });
      if (!session) {
        return null;
      }
      const user = await prisma.user.findUnique({
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
      return {
        ...session,
        user: user,
      };
    },
    async jwt({ token, account }) {
      if (account?.provider === 'siwe-csrf') {
        token.credentials = true;
      }
      return token;
    },
  },
  jwt: {
    encode: async function (params) {
      if (params.token?.credentials) {
        const sessionToken = uuid();

        if (!params.token.sub) {
          throw new Error('No user ID found in token');
        }

        const createdSession = await prisma.session.create({
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

export { handlers, auth };
