-- AlterTable: add columns with defaults for existing rows
ALTER TABLE "mandal_master" ADD COLUMN "amount" DECIMAL(12,2);
ALTER TABLE "mandal_master" ADD COLUMN "duration" INTEGER;

UPDATE "mandal_master"
SET
  "amount" = COALESCE(
    (
      SELECT p."price_per_person" * p."max_users"
      FROM "plans" p
      WHERE p."id" = "mandal_master"."mandal_plan_id"
    ),
    0
  ),
  "duration" = 12
WHERE "amount" IS NULL OR "duration" IS NULL;

ALTER TABLE "mandal_master" ALTER COLUMN "amount" SET NOT NULL;
ALTER TABLE "mandal_master" ALTER COLUMN "duration" SET NOT NULL;

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
