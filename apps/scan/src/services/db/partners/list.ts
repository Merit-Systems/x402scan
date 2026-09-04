import { partnersDb } from "@x402scan/partners-db";
import type { PartnerData } from "@x402scan/partners-db";

export const listPartners = async (): Promise<PartnerData[]> => {
  const query = `SELECT * FROM partners ORDER BY name ASC`;

  const resultSet = await partnersDb.query({
    query,
    format: "JSONEachRow",
  });
  return resultSet.json<PartnerData>();
};
