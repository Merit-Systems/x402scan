import { partnersDb, Tables } from '@x402scan/partners-db';
import type { PartnerData } from '@x402scan/partners-db';
import { createPartner } from './create';

/**
 * Finds a partner by name, or creates a new one if not found.
 * When creating, uses placeholder values for email and organization
 * since they're required but not provided in the invite code flow.
 */
export const findOrCreatePartner = async (
    name: string,
    merit_contact: string
): Promise<PartnerData> => {
    // Try to find existing partner by name
    const query = `
    SELECT * FROM ${Tables.Partners} 
    WHERE name = {name:String}
    LIMIT 1
  `;

    const resultSet = await partnersDb.query({
        query,
        format: 'JSONEachRow',
        query_params: { name },
    });

    const data = await resultSet.json();
    const rows = data as PartnerData[];

    if (rows && rows.length > 0) {
        const partner = rows[0];
        if (!partner) {
            // This shouldn't happen, but TypeScript needs this check
            throw new Error('Partner data is undefined');
        }

        // Update merit_contact if it's different
        if (partner.merit_contact !== merit_contact) {
            const updateQuery = `
        ALTER TABLE ${Tables.Partners}
        UPDATE merit_contact = {meritContact:String}
        WHERE id = {partnerId:String}
      `;

            await partnersDb.exec({
                query: updateQuery,
                query_params: {
                    partnerId: partner.id,
                    meritContact: merit_contact,
                },
            });
            partner.merit_contact = merit_contact;
        }
        return partner;
    }

    // Partner doesn't exist, create a new one
    // Use placeholder values for required fields email and organization
    return createPartner({
        name,
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@placeholder.com`,
        organization: "Placeholder Organization", // Use name as organization placeholder
        merit_contact,
    });
};

