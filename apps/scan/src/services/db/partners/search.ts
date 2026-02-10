import { partnersDb, Tables } from '@x402scan/partners-db';
import type { PartnerData } from '@x402scan/partners-db';

export const searchPartners = async (
  searchTerm: string
): Promise<PartnerData[]> => {
  if (!searchTerm.trim()) {
    return [];
  }

  // Use lower() with LIKE for case-insensitive search in ClickHouse
  // Lowercase the search term for comparison
  const lowerSearchTerm = searchTerm.toLowerCase();
  const query = `
    SELECT * FROM ${Tables.Partners} 
    WHERE lower(name) LIKE {searchTerm:String}
    ORDER BY name ASC
    LIMIT 20
  `;

  const resultSet = await partnersDb.query({
    query,
    format: 'JSONEachRow',
    query_params: { searchTerm: `%${lowerSearchTerm}%` },
  });

  const data = await resultSet.json();
  return data as PartnerData[];
};
