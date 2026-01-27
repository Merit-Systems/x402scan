import { partnersDb } from '@x402scan/partners-db';
import type { PartnerData } from '@x402scan/partners-db';

export const listPartners = async (): Promise<PartnerData[]> => {
    const query = `SELECT * FROM partners ORDER BY name ASC`;

    const resultSet = await partnersDb.query({
        query,
        format: 'JSONEachRow',
    });
    const data = await resultSet.json();

    return data as PartnerData[];

};

