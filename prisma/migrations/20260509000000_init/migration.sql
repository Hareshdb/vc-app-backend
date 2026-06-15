-- Create enums
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "UserType" AS ENUM ('MANDAL_ADMIN', 'MEMBER', 'SUPER_ADMIN');

-- Create mandal_master
CREATE TABLE "mandal_master" (
  "id" SERIAL PRIMARY KEY,
  "mandal_id" TEXT NOT NULL UNIQUE,
  "mandal_name" TEXT NOT NULL,
  "status" "Status" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3)
);

-- Create users
CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "user_type" "UserType" NOT NULL,
  "full_name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "country_code" TEXT NOT NULL DEFAULT '+91',
  "mobile_number" TEXT NOT NULL,
  "is_mobile_verified" BOOLEAN NOT NULL DEFAULT FALSE,
  "birth_date" TIMESTAMP(3),
  "status" "Status" NOT NULL DEFAULT 'ACTIVE',
  "last_loggedin_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3)
);

CREATE UNIQUE INDEX "users_country_code_mobile_number_key"
ON "users"("country_code", "mobile_number");

-- Create otp_master
CREATE TABLE "otp_master" (
  "id" SERIAL PRIMARY KEY,
  "country_code" TEXT NOT NULL DEFAULT '+91',
  "mobile_number" TEXT NOT NULL,
  "otp" TEXT NOT NULL,
  "expire_at" TIMESTAMP(3) NOT NULL,
  "is_used" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "otp_master_country_code_mobile_number_is_used_idx"
ON "otp_master"("country_code", "mobile_number", "is_used");

-- Create mandal_members
CREATE TABLE "mandal_members" (
  "id" SERIAL PRIMARY KEY,
  "mandal_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "mandal_members_mandal_id_fkey"
    FOREIGN KEY ("mandal_id") REFERENCES "mandal_master"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "mandal_members_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "mandal_members_mandal_id_user_id_key"
ON "mandal_members"("mandal_id", "user_id");
