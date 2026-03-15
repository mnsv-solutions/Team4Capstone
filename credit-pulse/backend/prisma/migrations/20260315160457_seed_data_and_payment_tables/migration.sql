/*
  Warnings:

  - A unique constraint covering the columns `[application_id,customer_id]` on the table `sub_loan` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,account_number]` on the table `user_bank_account` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[government_id_type,government_id_number]` on the table `user_profile` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ux_address_types_code_active";

-- DropIndex
DROP INDEX "ux_application_status_code_active";

-- DropIndex
DROP INDEX "ux_banks_code_active";

-- DropIndex
DROP INDEX "ux_decision_types_code_active";

-- DropIndex
DROP INDEX "ux_education_levels_code_active";

-- DropIndex
DROP INDEX "ux_employment_types_code_active";

-- DropIndex
DROP INDEX "ux_institutions_name_active";

-- DropIndex
DROP INDEX "ux_loan_types_code_active";

-- DropIndex
DROP INDEX "ux_roles_role_code_active";

-- DropIndex
DROP INDEX "idx_sub_loan_lookup";

-- DropIndex
DROP INDEX "ux_sub_loan_app_customer_active";

-- DropIndex
DROP INDEX "ux_sub_loan_one_primary_per_application";

-- DropIndex
DROP INDEX "idx_user_address_primary";

-- DropIndex
DROP INDEX "ux_user_address_one_primary_active";

-- DropIndex
DROP INDEX "ux_user_bank_accounts_user_number_active";

-- DropIndex
DROP INDEX "ux_user_profile_govt_id_active";

-- CreateTable
CREATE TABLE "loan_payment" (
    "payment_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL,
    "schedule_id" UUID,
    "payment_reference" VARCHAR(60),
    "payment_date" TIMESTAMPTZ(6) NOT NULL,
    "payment_amount" DECIMAL(12,2) NOT NULL,
    "payment_method" VARCHAR(30),
    "payment_status" VARCHAR(30) NOT NULL DEFAULT 'SUCCESS',
    "transaction_id" VARCHAR(100),
    "remarks" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "loan_payment_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "repayment_schedule" (
    "schedule_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL,
    "installment_number" INTEGER NOT NULL,
    "due_date" DATE NOT NULL,
    "opening_balance" DECIMAL(12,2) NOT NULL,
    "principal_component" DECIMAL(12,2) NOT NULL,
    "interest_component" DECIMAL(12,2) NOT NULL,
    "installment_amount" DECIMAL(12,2) NOT NULL,
    "closing_balance" DECIMAL(12,2) NOT NULL,
    "paid_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "payment_status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    "paid_date" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "repayment_schedule_pkey" PRIMARY KEY ("schedule_id")
);

-- CreateIndex
CREATE INDEX "loan_payment_application_id_idx" ON "loan_payment"("application_id");

-- CreateIndex
CREATE INDEX "loan_payment_schedule_id_idx" ON "loan_payment"("schedule_id");

-- CreateIndex
CREATE INDEX "repayment_schedule_application_id_due_date_idx" ON "repayment_schedule"("application_id", "due_date");

-- CreateIndex
CREATE INDEX "repayment_schedule_application_id_payment_status_idx" ON "repayment_schedule"("application_id", "payment_status");

-- CreateIndex
CREATE UNIQUE INDEX "ux_repayment_schedule_app_installment" ON "repayment_schedule"("application_id", "installment_number");

-- CreateIndex
CREATE INDEX "idx_sub_loan_lookup" ON "sub_loan"("application_id", "applicant_type", "customer_id") WHERE (is_active = true);

-- CreateIndex
CREATE UNIQUE INDEX "ux_sub_loan_app_customer_active" ON "sub_loan"("application_id", "customer_id") WHERE (is_active = true);

-- CreateIndex
CREATE INDEX "idx_user_address_primary" ON "user_address"("user_id", "is_primary") WHERE (is_active = true);

-- CreateIndex
CREATE UNIQUE INDEX "ux_user_bank_accounts_user_number_active" ON "user_bank_account"("user_id", "account_number") WHERE (is_active = true);

-- CreateIndex
CREATE UNIQUE INDEX "ux_user_profile_govt_id_active" ON "user_profile"("government_id_type", "government_id_number") WHERE ((is_active = true) AND (government_id_type IS NOT NULL) AND (government_id_number IS NOT NULL));

-- AddForeignKey
ALTER TABLE "loan_payment" ADD CONSTRAINT "fk_loan_payment_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "loan_payment" ADD CONSTRAINT "fk_loan_payment_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "loan_payment" ADD CONSTRAINT "loan_payment_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "loan_application"("application_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "loan_payment" ADD CONSTRAINT "loan_payment_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "repayment_schedule"("schedule_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "repayment_schedule" ADD CONSTRAINT "fk_repayment_schedule_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "repayment_schedule" ADD CONSTRAINT "fk_repayment_schedule_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "repayment_schedule" ADD CONSTRAINT "repayment_schedule_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "loan_application"("application_id") ON DELETE CASCADE ON UPDATE NO ACTION;
