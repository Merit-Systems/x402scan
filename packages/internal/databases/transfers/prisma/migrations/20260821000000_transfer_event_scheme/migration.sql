-- Tag transfers with the x402 scheme that produced them. NULL means the
-- legacy default (facilitator-signed direct transfer, i.e. `exact`).
ALTER TABLE "TransferEvent" ADD COLUMN "scheme" TEXT;
