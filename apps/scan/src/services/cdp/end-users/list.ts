import 'server-only';

import z from 'zod';
import { cdpFetch } from '../lib/fetch';

const authenticationMethodSchema = z
  .object({
    type: z.string(),
    email: z.string().email().optional(),
    phoneNumber: z.string().optional(),
    sub: z.string().optional(),
    kid: z.string().optional(),
  })
  .passthrough();

const endUserSchema = z.object({
  userId: z.string(),
  authenticationMethods: z.array(authenticationMethodSchema),
  evmAccounts: z.array(z.string()),
  evmSmartAccounts: z.array(z.string()),
  solanaAccounts: z.array(z.string()),
  createdAt: z.string(),
});

const listEndUsersResponseSchema = z.object({
  endUsers: z.array(endUserSchema),
  nextPageToken: z.string().optional(),
});

type EndUser = z.infer<typeof endUserSchema>;

const listEndUsers = async (pageToken?: string) => {
  const queryParams = new URLSearchParams({ pageSize: '100' });
  if (pageToken) {
    queryParams.set('pageToken', pageToken);
  }
  const basePath = `/platform/v2/end-users`;
  const path = `${basePath}?${queryParams.toString()}`;

  const response = await cdpFetch(
    {
      requestMethod: 'GET',
      requestPath: path,
      requestHost: 'api.cdp.coinbase.com',
    },
    listEndUsersResponseSchema
  );
  return response;
};

export const listAllEndUsers = async (): Promise<EndUser[]> => {
  const allEndUsers: EndUser[] = [];
  let nextPageToken: string | undefined = undefined;

  do {
    const response = await listEndUsers(nextPageToken);
    allEndUsers.push(...response.endUsers);
    nextPageToken = response.nextPageToken;
  } while (nextPageToken);

  return allEndUsers;
};
