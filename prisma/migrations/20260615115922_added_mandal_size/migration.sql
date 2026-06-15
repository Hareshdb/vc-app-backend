/*
  Warnings:

  - Added the required column `mandal_size` to the `mandal_master` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MANDAL_SIZE" AS ENUM ('SMALL', 'MEDIUM', 'LARGE', 'JUMBO');

-- AlterTable
ALTER TABLE "mandal_master" ADD COLUMN     "mandal_size" "MANDAL_SIZE" NOT NULL;
