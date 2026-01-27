import { partnersDb, Tables } from '@x402scan/partners-db';

/**
 * Finds partners with the given invite code ID and upserts the recipient address
 * into their wallet_addresses array
 */
export const upsertWalletAddressForInviteCode = async (
  inviteCodeId: string,
  recipientAddress: string
): Promise<void> => {
  try {
    // Find all partners that have this invite code ID in their invite_codes array
    const query = `
      SELECT id, wallet_addresses 
      FROM ${Tables.Partners} 
      WHERE has(invite_codes, {inviteCodeId:String})
    `;

    const resultSet = await partnersDb.query({
      query,
      format: 'JSONEachRow',
      query_params: { inviteCodeId },
    });

    const rows = await resultSet.json<{
      id: string;
      wallet_addresses: string[];
    }>();

    // Update each partner's wallet_addresses array
    for (const partner of rows) {
      const currentAddresses = partner.wallet_addresses || [];
      const normalizedAddress = recipientAddress.toLowerCase();

      // Only add if not already present
      if (!currentAddresses.includes(normalizedAddress)) {
        const updateQuery = `
          ALTER TABLE ${Tables.Partners}
          UPDATE wallet_addresses = arrayConcat(wallet_addresses, [{address:String}])
          WHERE id = {partnerId:String}
        `;

        await partnersDb.exec({
          query: updateQuery,
          query_params: {
            partnerId: partner.id,
            address: normalizedAddress,
          },
        });
      }
    }
  } catch (error) {
    // Log error but don't throw - this shouldn't fail the redemption
    console.error('Error upserting wallet address for invite code:', error);
  }
};
