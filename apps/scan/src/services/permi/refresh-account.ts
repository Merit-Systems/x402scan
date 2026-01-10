import { env } from '@/env';
import { Account, scanDb } from '@x402scan/scan-db';

export const refreshPermiAccount = async (account: Account) => {
  if (account.provider !== 'permi') {
    throw new Error('Account is not a Permi account');
  }

  if (account.expires_at && account.expires_at * 1000 > Date.now()) {
    return account;
  }

  try {
    const response = await fetch('https://www.permi.xyz/api/oauth/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: env.PERMI_APP_ID,
        grant_type: 'refresh_token',
        refresh_token: account.refresh_token!,
      }),
    });
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
          providerAccountId: account.providerAccountId,
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
    return updatedAccount;
  } catch (error) {
    console.error('Error refreshing access_token', error);
    throw new Error('Failed to refresh access_token');
  }
};
