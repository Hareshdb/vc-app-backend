/*
  Warnings:

  - You are about to drop the column `duration` on the `mandal_master` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "mandal_master" DROP COLUMN "duration",
ADD COLUMN     "mandal_start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
