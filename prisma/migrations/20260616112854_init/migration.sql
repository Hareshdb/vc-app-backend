-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "GENDER" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PAYMENT_PENDING', 'PENDING');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('MANDAL_ADMIN', 'MEMBER', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "MANDAL_STRATEGY" AS ENUM ('GROWING', 'COLLECTIVE');

-- CreateEnum
CREATE TYPE "MemberPlanStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'MEMBERSHIP_FEE', 'PENALTY', 'EXPENSE', 'INCOME');

-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('CASH', 'BANK', 'UPI', 'CARD', 'CHEQUE');

-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateTable
CREATE TABLE "plans" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "number_of_members" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandal_master" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "mandal_name" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "mandal_strategy" "MANDAL_STRATEGY" NOT NULL,
    "mandal_plan_id" INTEGER NOT NULL,
    "is_trial_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "mandal_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "user_type" "UserType" NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "country_code" TEXT NOT NULL DEFAULT '+91',
    "mobile_number" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "gender" "GENDER" NOT NULL,
    "birth_date" TIMESTAMP(3),
    "address" TEXT NOT NULL,
    "is_mobile_verified" BOOLEAN NOT NULL DEFAULT false,
    "joined_at" TIMESTAMP(3),
    "last_loggedin_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_master" (
    "id" SERIAL NOT NULL,
    "country_code" TEXT NOT NULL DEFAULT '+91',
    "mobile_number" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expire_at" TIMESTAMP(3) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "otp_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandal_members" (
    "id" SERIAL NOT NULL,
    "mandal_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mandal_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_accounts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "account_name" TEXT NOT NULL,
    "bank_name" TEXT,
    "account_number" TEXT,
    "ifsc_code" TEXT,
    "upi_id" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "member_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PaymentMethodType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_plan_subscriptions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "payment_method_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_trial_active" BOOLEAN NOT NULL DEFAULT false,
    "last_payment_date" TIMESTAMP(3),
    "expire_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "member_plan_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "mandal_id" INTEGER NOT NULL,
    "payment_method_id" INTEGER,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_type" "TransactionType" NOT NULL,
    "entry_type" "EntryType" NOT NULL,
    "remarks" TEXT,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mandal_master_code_key" ON "mandal_master"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_mobile_number_key" ON "users"("mobile_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_country_code_mobile_number_key" ON "users"("country_code", "mobile_number");

-- CreateIndex
CREATE INDEX "otp_master_country_code_mobile_number_is_used_idx" ON "otp_master"("country_code", "mobile_number", "is_used");

-- CreateIndex
CREATE UNIQUE INDEX "mandal_members_mandal_id_user_id_key" ON "mandal_members"("mandal_id", "user_id");

-- AddForeignKey
ALTER TABLE "mandal_master" ADD CONSTRAINT "mandal_master_mandal_plan_id_fkey" FOREIGN KEY ("mandal_plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandal_members" ADD CONSTRAINT "mandal_members_mandal_id_fkey" FOREIGN KEY ("mandal_id") REFERENCES "mandal_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandal_members" ADD CONSTRAINT "mandal_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_accounts" ADD CONSTRAINT "member_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_plan_subscriptions" ADD CONSTRAINT "member_plan_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_plan_subscriptions" ADD CONSTRAINT "member_plan_subscriptions_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_mandal_id_fkey" FOREIGN KEY ("mandal_id") REFERENCES "mandal_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
