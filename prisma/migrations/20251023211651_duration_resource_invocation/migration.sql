/*
  Warnings:

  - Added the required column `duration` to the `ResourceInvocation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."ResourceInvocation" ADD COLUMN     "duration" INTEGER NOT NULL;
