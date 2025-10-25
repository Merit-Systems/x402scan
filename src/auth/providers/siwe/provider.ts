import { SiweMessage } from 'siwe';
import Credentials, {
  type CredentialsConfig,
} from 'next-auth/providers/credentials';
import { z } from 'zod';
import { prisma } from '@/services/db/client';
import {
  SIWE_PROVIDER_ID,
  SIWE_PROVIDER_NAME,
  SIWE_STATEMENT,
} from './constants';
import { auth } from '@/auth';

const siweCredentialsSchema = z.object({
  message: z.string().transform((val: string) => {
    try {
      return JSON.parse(val) as SiweMessage;
    } catch {
      throw new Error('Invalid JSON in message');
    }
  }),
  signedMessage: z.string(),
  email: z.email().optional(),
});

function SiweProvider(options?: Partial<CredentialsConfig>) {
  return Credentials({
    id: SIWE_PROVIDER_ID,
    name: SIWE_PROVIDER_NAME,
    credentials: {
      message: { label: 'Message', type: 'text' },
      signedMessage: { label: 'Signed Message', type: 'text' },
      email: { label: 'Email', type: 'text', optional: true },
    },
    async authorize(credentials) {
      const parseResult = siweCredentialsSchema.safeParse(credentials);
      if (!parseResult.success) {
        throw new Error('Invalid credentials');
      }
      const { message } = parseResult.data;
      const siwe = new SiweMessage(message);

      const { address } = await verifySignature({
        siwe,
        credentials: parseResult.data,
        nonce: message.nonce,
      });

      const email = parseResult.data.email;

      const session = await auth();

      if (session) {
        // link account to user
        const { user } = await prisma.account.upsert({
          where: {
            provider_providerAccountId: {
              provider: SIWE_PROVIDER_ID,
              providerAccountId: address,
            },
          },
          update: {
            userId: session.user.id,
          },
          create: {
            type: 'siwe',
            userId: session.user.id,
            provider: SIWE_PROVIDER_ID,
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
        const user = await prisma.user.findFirst({
          where: {
            accounts: {
              some: {
                provider: SIWE_PROVIDER_ID,
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
          return await prisma.user.create({
            data: {
              email,
              accounts: {
                create: {
                  type: 'siwe',
                  provider: SIWE_PROVIDER_ID,
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

async function verifySignature({
  siwe,
  credentials,
  nonce,
}: {
  siwe: SiweMessage;
  credentials: z.infer<typeof siweCredentialsSchema>;
  nonce: string;
}) {
  const result = await siwe.verify({
    signature: credentials.signedMessage,
    nonce,
  });
  if (!result.success) {
    throw new Error('Invalid signature');
  }
  if (SIWE_STATEMENT !== result.data.statement) {
    throw new Error('Statement mismatch');
  }
  if (new Date(result.data.expirationTime!) < new Date()) {
    throw new Error('Signature expired');
  }
  return result.data;
}

export default SiweProvider;
