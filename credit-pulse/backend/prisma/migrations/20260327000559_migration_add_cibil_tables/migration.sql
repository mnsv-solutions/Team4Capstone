-- CreateTable
CREATE TABLE "cibil_reports" (
    "cibil_report_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL,
    "request_id" VARCHAR(50) NOT NULL,
    "reference_id" VARCHAR(50) NOT NULL,
    "bureau" VARCHAR(20) NOT NULL DEFAULT 'CIBIL',
    "report_date" TIMESTAMPTZ(6) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "cibil_score" INTEGER NOT NULL,
    "score_band" VARCHAR(20) NOT NULL,
    "risk_level" VARCHAR(20) NOT NULL,
    "score_version" VARCHAR(20) NOT NULL,
    "total_accounts" INTEGER NOT NULL,
    "active_accounts" INTEGER NOT NULL,
    "closed_accounts" INTEGER NOT NULL,
    "total_outstanding_balance" DECIMAL(14,2) NOT NULL,
    "secured_loan_accounts" INTEGER NOT NULL,
    "unsecured_loan_accounts" INTEGER NOT NULL,
    "total_missed_payments" INTEGER NOT NULL DEFAULT 0,
    "recent_delinquency" BOOLEAN NOT NULL DEFAULT false,
    "credit_utilization_ratio" DECIMAL(5,2) NOT NULL,
    "average_account_age_years" DECIMAL(5,2) NOT NULL,
    "debt_to_income_estimate" DECIMAL(5,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cibil_reports_pkey" PRIMARY KEY ("cibil_report_id")
);

-- CreateTable
CREATE TABLE "cibil_applicants" (
    "cibil_applicant_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cibil_report_id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "sin_number" VARCHAR(20) NOT NULL,
    "mobile_number" VARCHAR(15) NOT NULL,

    CONSTRAINT "cibil_applicants_pkey" PRIMARY KEY ("cibil_applicant_id")
);

-- CreateTable
CREATE TABLE "cibil_accounts" (
    "cibil_account_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cibil_report_id" UUID NOT NULL,
    "account_type" VARCHAR(50) NOT NULL,
    "lender_name" VARCHAR(100) NOT NULL,
    "account_number_masked" VARCHAR(20) NOT NULL,
    "ownership_type" VARCHAR(50) NOT NULL,
    "open_date" DATE NOT NULL,
    "current_balance" DECIMAL(14,2) NOT NULL,
    "credit_limit" DECIMAL(14,2),
    "payment_status" VARCHAR(20) NOT NULL,
    "days_past_due" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "cibil_accounts_pkey" PRIMARY KEY ("cibil_account_id")
);

-- CreateTable
CREATE TABLE "cibil_payment_history" (
    "cibil_payment_history_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cibil_report_id" UUID NOT NULL,
    "month_index" INTEGER NOT NULL,
    "status_code" VARCHAR(10) NOT NULL,

    CONSTRAINT "cibil_payment_history_pkey" PRIMARY KEY ("cibil_payment_history_id")
);

-- CreateTable
CREATE TABLE "cibil_enquiries" (
    "cibil_enquiry_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cibil_report_id" UUID NOT NULL,
    "enquiry_date" DATE NOT NULL,
    "institution" VARCHAR(100) NOT NULL,
    "enquiry_type" VARCHAR(50) NOT NULL,

    CONSTRAINT "cibil_enquiries_pkey" PRIMARY KEY ("cibil_enquiry_id")
);

-- CreateTable
CREATE TABLE "cibil_risk_indicators" (
    "cibil_risk_indicator_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cibil_report_id" UUID NOT NULL,
    "high_credit_utilization" BOOLEAN NOT NULL DEFAULT false,
    "recent_hard_enquiries" BOOLEAN NOT NULL DEFAULT false,
    "thin_file" BOOLEAN NOT NULL DEFAULT false,
    "credit_mix_healthy" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cibil_risk_indicators_pkey" PRIMARY KEY ("cibil_risk_indicator_id")
);

-- CreateTable
CREATE TABLE "application_credit_check" (
    "credit_check_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL,
    "cibil_report_id" UUID,
    "request_id" VARCHAR(50),
    "bureau_name" VARCHAR(20) NOT NULL DEFAULT 'CIBIL',
    "bureau_reference_id" VARCHAR(50),
    "bureau_status" VARCHAR(20) NOT NULL,
    "credit_score" INTEGER,
    "score_band" VARCHAR(20),
    "risk_level" VARCHAR(20),
    "checked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checked_by" UUID,
    "remarks" TEXT,
    "raw_response" JSONB,
    "is_latest" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_credit_check_pkey" PRIMARY KEY ("credit_check_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_cibil_reports_application_id" ON "cibil_reports"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_cibil_reports_request_id" ON "cibil_reports"("request_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_cibil_reports_reference_id" ON "cibil_reports"("reference_id");

-- CreateIndex
CREATE INDEX "idx_cibil_reports_report_date" ON "cibil_reports"("report_date");

-- CreateIndex
CREATE INDEX "idx_cibil_reports_cibil_score" ON "cibil_reports"("cibil_score");

-- CreateIndex
CREATE INDEX "idx_cibil_reports_risk_level" ON "cibil_reports"("risk_level");

-- CreateIndex
CREATE UNIQUE INDEX "uq_cibil_applicants_report_id" ON "cibil_applicants"("cibil_report_id");

-- CreateIndex
CREATE INDEX "idx_cibil_applicants_sin_number" ON "cibil_applicants"("sin_number");

-- CreateIndex
CREATE INDEX "idx_cibil_applicants_mobile_number" ON "cibil_applicants"("mobile_number");

-- CreateIndex
CREATE INDEX "idx_cibil_applicants_date_of_birth" ON "cibil_applicants"("date_of_birth");

-- CreateIndex
CREATE INDEX "idx_cibil_accounts_report_id" ON "cibil_accounts"("cibil_report_id");

-- CreateIndex
CREATE INDEX "idx_cibil_accounts_lender_name" ON "cibil_accounts"("lender_name");

-- CreateIndex
CREATE INDEX "idx_cibil_payment_history_report_id" ON "cibil_payment_history"("cibil_report_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_cibil_payment_history_report_month" ON "cibil_payment_history"("cibil_report_id", "month_index");

-- CreateIndex
CREATE INDEX "idx_cibil_enquiries_report_date" ON "cibil_enquiries"("cibil_report_id", "enquiry_date");

-- CreateIndex
CREATE UNIQUE INDEX "uq_cibil_risk_indicators_report_id" ON "cibil_risk_indicators"("cibil_report_id");

-- CreateIndex
CREATE INDEX "idx_application_credit_check_application_id" ON "application_credit_check"("application_id");

-- CreateIndex
CREATE INDEX "idx_application_credit_check_checked_at" ON "application_credit_check"("checked_at");

-- CreateIndex
CREATE INDEX "idx_application_credit_check_bureau_status" ON "application_credit_check"("bureau_status");

-- AddForeignKey
ALTER TABLE "cibil_reports" ADD CONSTRAINT "cibil_reports_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "loan_application"("application_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cibil_applicants" ADD CONSTRAINT "cibil_applicants_cibil_report_id_fkey" FOREIGN KEY ("cibil_report_id") REFERENCES "cibil_reports"("cibil_report_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cibil_accounts" ADD CONSTRAINT "cibil_accounts_cibil_report_id_fkey" FOREIGN KEY ("cibil_report_id") REFERENCES "cibil_reports"("cibil_report_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cibil_payment_history" ADD CONSTRAINT "cibil_payment_history_cibil_report_id_fkey" FOREIGN KEY ("cibil_report_id") REFERENCES "cibil_reports"("cibil_report_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cibil_enquiries" ADD CONSTRAINT "cibil_enquiries_cibil_report_id_fkey" FOREIGN KEY ("cibil_report_id") REFERENCES "cibil_reports"("cibil_report_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cibil_risk_indicators" ADD CONSTRAINT "cibil_risk_indicators_cibil_report_id_fkey" FOREIGN KEY ("cibil_report_id") REFERENCES "cibil_reports"("cibil_report_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "application_credit_check" ADD CONSTRAINT "application_credit_check_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "loan_application"("application_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_credit_check" ADD CONSTRAINT "application_credit_check_cibil_report_id_fkey" FOREIGN KEY ("cibil_report_id") REFERENCES "cibil_reports"("cibil_report_id") ON DELETE SET NULL ON UPDATE CASCADE;
