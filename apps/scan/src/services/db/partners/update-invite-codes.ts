import { partnersDb, Tables } from '@x402scan/partners-db';

/**
 * Adds an invite code ID to a partner's invite_codes array
 */
export const addInviteCodeToPartner = async (
    partnerId: string,
    inviteCodeId: string
): Promise<void> => {
    try {
        // First, get the current partner data
        const query = `SELECT * FROM ${Tables.Partners} WHERE id = {partnerId:String} LIMIT 1`;

        const resultSet = await partnersDb.query({
            query,
            format: 'JSONEachRow',
            query_params: { partnerId },
        });

        const rows = await resultSet.json<{
            id: string;
            invite_codes: string[];
        }>();

        const partner = rows[0];
        if (!partner) {
            throw new Error(`Partner with id ${partnerId} not found`);
        }

        const currentInviteCodes = partner.invite_codes || [];

        // Only add if not already present
        if (!currentInviteCodes.includes(inviteCodeId)) {
            // Update the partner with the new invite code ID using arrayConcat
            const updateQuery = `
        ALTER TABLE ${Tables.Partners}
        UPDATE invite_codes = arrayConcat(invite_codes, [{inviteCodeId:String}])
        WHERE id = {partnerId:String}
      `;

            await partnersDb.exec({
                query: updateQuery,
                query_params: {
                    partnerId,
                    inviteCodeId,
                },
            });
        }
    } catch (error) {
        console.error('Error adding invite code to partner:', error);
        throw new Error(
            `Failed to add invite code to partner: ${error instanceof Error ? error.message : String(error)}`
        );
    }
};

