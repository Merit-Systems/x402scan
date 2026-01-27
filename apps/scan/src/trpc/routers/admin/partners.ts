import { createTRPCRouter, adminProcedure } from '../../trpc';
import { listPartners, createPartner, createPartnerSchema } from '@/services/db/partners';

export const adminPartnersRouter = createTRPCRouter({
    list: adminProcedure.query(async () => {
        return listPartners();
    }),

    create: adminProcedure
        .input(createPartnerSchema)
        .mutation(async ({ input }) => {
            return createPartner(input);
        }),
});

