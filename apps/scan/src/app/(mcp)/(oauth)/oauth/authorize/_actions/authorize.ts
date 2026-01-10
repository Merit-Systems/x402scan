'use server';

import { redirect } from 'next/navigation';

import { auth } from '@/auth';

import type { Route } from 'next';
import type z from 'zod';
import {
  createAuthCodeJwt,
  type authorizeParamsSchema,
} from '@/app/(mcp)/_lib/auth-code';

export const authorize = async ({
  state,
  ...jwtBody
}: z.infer<typeof authorizeParamsSchema>) => {
  const session = await auth();
  if (!session) {
    return { error: 'unauthorized', error_description: 'Invalid user' };
  }

  // create the auth code jwt
  const authCodeJwt = await createAuthCodeJwt({
    ...jwtBody,
    user_id: session.user.id,
  });

  // return the redirect URL for the client to use
  const redirectUrl = new URL(jwtBody.redirect_uri);
  redirectUrl.searchParams.set('code', authCodeJwt);
  if (state) redirectUrl.searchParams.set('state', state);

  return redirect(redirectUrl.toString() as Route);
};
