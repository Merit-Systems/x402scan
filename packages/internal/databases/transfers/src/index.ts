export { Prisma } from '../generated/prisma/client';
export type { TransferEvent } from '../generated/prisma/client';
export {
  transfersDb,
  transfersDbReadReplicas,
  transfersHttpPrimary,
  transfersHttpReplicas,
} from './client';
