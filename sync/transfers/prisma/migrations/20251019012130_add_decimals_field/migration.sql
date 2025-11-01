/*
  Warnings:

  - Added the required column `decimals` to the `TransferEvent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TransferEvent" ADD COLUMN     "decimals" INTEGER NOT NULL;
