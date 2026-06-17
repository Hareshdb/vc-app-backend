/*
  Warnings:

  - You are about to drop the column `number_of_members` on the `plans` table. All the data in the column will be lost.
  - Added the required column `description` to the `plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `max_users` to the `plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `min_users` to the `plans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "plans" DROP COLUMN "number_of_members",
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "max_users" INTEGER NOT NULL,
ADD COLUMN     "min_users" INTEGER NOT NULL;
