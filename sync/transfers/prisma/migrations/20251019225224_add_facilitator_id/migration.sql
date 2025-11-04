/*
  Warnings:

  - Added the required column `facilitator_id` to the `TransferEvent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TransferEvent" ADD COLUMN     "facilitator_id" TEXT NOT NULL;
