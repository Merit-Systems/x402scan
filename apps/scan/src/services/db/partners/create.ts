import { v4 as uuidv4 } from 'uuid';
import z from 'zod';
import { insertPartner } from '@x402scan/partners-db';
import type { PartnerData } from '@x402scan/partners-db';

export const createPartnerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  organization: z.string().min(1),
  merit_contact: z.string().min(1),
});

export const createPartner = async (
  input: z.infer<typeof createPartnerSchema>
): Promise<PartnerData> => {
  try {
    const partnerData: PartnerData = {
      id: uuidv4(),
      name: input.name,
      email: input.email,
      organization: input.organization,
      merit_contact: input.merit_contact,
      meeting_date: [],
      wallet_addresses: [],
      invite_codes: [],
    };

    await insertPartner(partnerData);
    return partnerData;
  } catch (error) {
    console.error('Error creating partner:', error);
    throw new Error(
      `Failed to create partner: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
