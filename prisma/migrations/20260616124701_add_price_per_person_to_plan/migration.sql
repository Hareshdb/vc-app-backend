/*
  Warnings:

  - Added the required column `price_per_person` to the `plans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "price_per_person" INTEGER NOT NULL;
