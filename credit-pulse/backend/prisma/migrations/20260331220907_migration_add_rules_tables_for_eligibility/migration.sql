-- CreateTable
CREATE TABLE "eligibility_rule_set" (
    "rule_set_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rule_set_code" VARCHAR(50) NOT NULL,
    "rule_set_name" VARCHAR(150) NOT NULL,
    "version_no" INTEGER NOT NULL,
    "description" TEXT,
    "effective_from" TIMESTAMPTZ(6),
    "effective_to" TIMESTAMPTZ(6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "eligibility_rule_set_pkey" PRIMARY KEY ("rule_set_id")
);

-- CreateTable
CREATE TABLE "eligibility_rule" (
    "rule_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rule_set_id" UUID NOT NULL,
    "rule_code" VARCHAR(50) NOT NULL,
    "rule_name" VARCHAR(150) NOT NULL,
    "metric_name" VARCHAR(50) NOT NULL,
    "operator" VARCHAR(20) NOT NULL,
    "threshold_value" DECIMAL(12,2),
    "threshold_min" DECIMAL(12,2),
    "threshold_max" DECIMAL(12,2),
    "expected_value" VARCHAR(50),
    "severity" VARCHAR(20) NOT NULL DEFAULT 'SOFT_FAIL',
    "failure_message" TEXT NOT NULL,
    "evaluation_order" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "eligibility_rule_pkey" PRIMARY KEY ("rule_id")
);

-- CreateTable
CREATE TABLE "application_eligibility_summary" (
    "eligibility_summary_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL,
    "application_number" VARCHAR(40) NOT NULL,
    "rule_set_id" UUID NOT NULL,
    "eligibility_status" VARCHAR(30) NOT NULL,
    "failed_rule_count" INTEGER NOT NULL DEFAULT 0,
    "reason_json" JSONB,
    "decision_snapshot_json" JSONB,
    "calculated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "application_eligibility_summary_pkey" PRIMARY KEY ("eligibility_summary_id")
);

-- CreateIndex
CREATE INDEX "idx_eligibility_rule_set_is_active" ON "eligibility_rule_set"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "uq_eligibility_rule_set_code_version" ON "eligibility_rule_set"("rule_set_code", "version_no");

-- CreateIndex
CREATE INDEX "idx_eligibility_rule_rule_set_active" ON "eligibility_rule"("rule_set_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_eligibility_rule_metric_name" ON "eligibility_rule"("metric_name");

-- CreateIndex
CREATE UNIQUE INDEX "uq_eligibility_rule_rule_set_code" ON "eligibility_rule"("rule_set_id", "rule_code");

-- CreateIndex
CREATE INDEX "idx_application_eligibility_summary_application_id" ON "application_eligibility_summary"("application_id");

-- CreateIndex
CREATE INDEX "idx_application_eligibility_summary_application_number" ON "application_eligibility_summary"("application_number");

-- CreateIndex
CREATE INDEX "idx_application_eligibility_summary_rule_set_id" ON "application_eligibility_summary"("rule_set_id");

-- CreateIndex
CREATE INDEX "idx_application_eligibility_summary_status" ON "application_eligibility_summary"("eligibility_status");

-- AddForeignKey
ALTER TABLE "eligibility_rule" ADD CONSTRAINT "eligibility_rule_rule_set_id_fkey" FOREIGN KEY ("rule_set_id") REFERENCES "eligibility_rule_set"("rule_set_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "application_eligibility_summary" ADD CONSTRAINT "application_eligibility_summary_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "loan_application"("application_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "application_eligibility_summary" ADD CONSTRAINT "application_eligibility_summary_rule_set_id_fkey" FOREIGN KEY ("rule_set_id") REFERENCES "eligibility_rule_set"("rule_set_id") ON DELETE RESTRICT ON UPDATE NO ACTION;
