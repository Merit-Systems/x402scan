import { z } from 'zod';

import Credentials, {
  type CredentialsConfig,
} from 'next-auth/providers/credentials';

import {
  address as toAddress,
  getBase58Encoder,
  getPublicKeyFromAddress,
  signatureBytes,
  verifySignature,
} from '@solana/kit';

import { scanDb } from '../../../../../../databases/scan/src';

import { auth } from '@/auth';

import { SIWS_PROVIDER_ID, SIWS_PROVIDER_NAME } from './constants';

import { solanaAddressSchema } from '@/lib/schemas';

const siwsCredentialsSchema = z.object({
  address: solanaAddressSchema,
  signedMessage: z.string().transform(str => getBase58Encoder().encode(str)),
  signature: z.string().transform(str => getBase58Encoder().encode(str)),
  email: z.email().optional(),
});

function SiwsProvider(options?: Partial<CredentialsConfig>) {
  return Credentials({
    id: SIWS_PROVIDER_ID,
    name: SIWS_PROVIDER_NAME,
    credentials: {
      address: { label: 'Address', type: 'text' },
      signedMessage: { label: 'Message', type: 'text' }, // actually will be passed as base58 string
      signature: { label: 'Signature', type: 'text' }, // actually will be passed as base58 string
      email: { label: 'Email', type: 'text', optional: true },
    },
    async authorize(credentials) {
      const parseResult = siwsCredentialsSchema.safeParse(credentials);
      if (!parseResult.success) {
        throw new Error('Invalid credentials');
      }
      const { address, signedMessage, signature, email } = parseResult.data;

      const verified = await verifySignature(
        await getPublicKeyFromAddress(toAddress(address)),
        signatureBytes(signature),
        signedMessage
      );

      if (!verified) {
        throw new Error('Invalid signature');
      }

      const session = await auth();

      if (session) {
        // link account to user
        const { user } = await scanDb.account.upsert({
          where: {
            provider_providerAccountId: {
              provider: SIWS_PROVIDER_ID,
              providerAccountId: address,
            },
          },
          update: {
            userId: session.user.id,
          },
          create: {
            type: 'siwe',
            userId: session.user.id,
            provider: SIWS_PROVIDER_ID,
            providerAccountId: address,
          },
          include: {
            user: {
              include: {
                accounts: true,
              },
            },
          },
        });

        return user;
      } else {
        const user = await scanDb.user.findFirst({
          where: {
            accounts: {
              some: {
                provider: SIWS_PROVIDER_ID,
                providerAccountId: address,
              },
            },
          },
          include: {
            accounts: true,
          },
        });

        // no user, create a user and an account
        if (!user) {
          return await scanDb.user.create({
            data: {
              email,
              accounts: {
                create: {
                  type: 'siwe',
                  provider: SIWS_PROVIDER_ID,
                  providerAccountId: address,
                },
              },
            },
            include: {
              accounts: true,
            },
          });
        }

        return user;
      }
    },
    ...options,
  });
}

export default SiwsProvider;
