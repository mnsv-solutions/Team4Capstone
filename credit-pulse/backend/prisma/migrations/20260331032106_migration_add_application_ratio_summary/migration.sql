-- CreateTable
CREATE TABLE "application_ratio_summary" (
    "ratio_summary_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL,
    "application_number" VARCHAR(40) NOT NULL,
    "customer_id" UUID NOT NULL,
    "dbr" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "emi_to_income" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "credit_utilization" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "loan_to_income" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "monthly_income" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "annual_income" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_monthly_debt_payments" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "proposed_emi" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "requested_loan_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "cibil_report_id" UUID,
    "calculation_version" VARCHAR(30) NOT NULL DEFAULT 'v1',
    "calculated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "input_snapshot_json" JSONB,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "cibil_reportsCibil_report_id" UUID,

    CONSTRAINT "application_ratio_summary_pkey" PRIMARY KEY ("ratio_summary_id")
);

-- CreateIndex
CREATE INDEX "application_ratio_summary_application_number_idx" ON "application_ratio_summary"("application_number");

-- CreateIndex
CREATE INDEX "application_ratio_summary_customer_id_idx" ON "application_ratio_summary"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "application_ratio_summary_application_id_key" ON "application_ratio_summary"("application_id");

-- AddForeignKey
ALTER TABLE "application_ratio_summary" ADD CONSTRAINT "application_ratio_summary_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "loan_application"("application_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_ratio_summary" ADD CONSTRAINT "application_ratio_summary_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_ratio_summary" ADD CONSTRAINT "application_ratio_summary_cibil_reportsCibil_report_id_fkey" FOREIGN KEY ("cibil_reportsCibil_report_id") REFERENCES "cibil_reports"("cibil_report_id") ON DELETE SET NULL ON UPDATE CASCADE;
