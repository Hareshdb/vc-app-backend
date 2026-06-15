/*
  Warnings:

  - Added the required column `mandal_strategy` to the `mandal_master` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PAYMENT_PENDING', 'PENDING');

-- CreateEnum
CREATE TYPE "MANDAL_STRATEGY" AS ENUM ('GROWING', 'COLLECTIVE');

-- AlterTable
ALTER TABLE "mandal_master" ADD COLUMN     "is_trial_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mandal_strategy" "MANDAL_STRATEGY" NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "mandal_members" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "otp_master" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "updated_at" DROP DEFAULT;
