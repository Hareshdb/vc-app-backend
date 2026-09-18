-- RenameColumns: align DB columns with Prisma schema
-- max_users → members_capacity
-- price_per_person → plan_amount
-- drop min_users (not used in schema)

-- Step 1: Drop min_users column
ALTER TABLE "plans" DROP COLUMN IF EXISTS "min_users";

-- Step 2: Rename max_users → members_capacity
ALTER TABLE "plans" RENAME COLUMN "max_users" TO "members_capacity";

-- Step 3: Rename price_per_person → plan_amount and change type to DECIMAL(12,2)
ALTER TABLE "plans" RENAME COLUMN "price_per_person" TO "plan_amount";
ALTER TABLE "plans" ALTER COLUMN "plan_amount" SET DATA TYPE DECIMAL(12,2) USING "plan_amount"::DECIMAL(12,2);
