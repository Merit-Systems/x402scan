-- CreateTable
CREATE TABLE "TransferEvent" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "transaction_from" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "block_timestamp" TIMESTAMP(3) NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "chain" TEXT NOT NULL,

    CONSTRAINT "TransferEvent_pkey" PRIMARY KEY ("id")
);
