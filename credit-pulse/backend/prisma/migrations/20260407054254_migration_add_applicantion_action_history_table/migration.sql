-- CreateTable
CREATE TABLE "application_action_history" (
    "action_history_id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "action_type" VARCHAR(100) NOT NULL,
    "from_status_id" UUID,
    "to_status_id" UUID NOT NULL,
    "performed_by_user_id" UUID NOT NULL,
    "performed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "performer_role_code" VARCHAR(50) NOT NULL,
    "decision_type_id" UUID,
    "remarks" TEXT,
    "approved_loan_amount" DECIMAL(18,2),
    "approved_interest_rate" DECIMAL(5,2),
    "approved_tenure_months" INTEGER,
    "approved_emi" DECIMAL(18,2),
    "disbursed_amount" DECIMAL(18,2),
    "metadata_json" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_by" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "application_action_history_pkey" PRIMARY KEY ("action_history_id")
);

-- CreateIndex
CREATE INDEX "idx_application_action_history_application_id" ON "application_action_history"("application_id");

-- CreateIndex
CREATE INDEX "idx_application_action_history_action_type" ON "application_action_history"("action_type");

-- CreateIndex
CREATE INDEX "idx_application_action_history_from_status_id" ON "application_action_history"("from_status_id");

-- CreateIndex
CREATE INDEX "idx_application_action_history_to_status_id" ON "application_action_history"("to_status_id");

-- CreateIndex
CREATE INDEX "idx_application_action_history_performed_by_user_id" ON "application_action_history"("performed_by_user_id");

-- CreateIndex
CREATE INDEX "idx_application_action_history_decision_type_id" ON "application_action_history"("decision_type_id");

-- CreateIndex
CREATE INDEX "idx_application_action_history_performed_at" ON "application_action_history"("performed_at");

-- AddForeignKey
ALTER TABLE "application_action_history" ADD CONSTRAINT "application_action_history_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "loan_application"("application_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_action_history" ADD CONSTRAINT "application_action_history_from_status_id_fkey" FOREIGN KEY ("from_status_id") REFERENCES "application_status"("status_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_action_history" ADD CONSTRAINT "application_action_history_to_status_id_fkey" FOREIGN KEY ("to_status_id") REFERENCES "application_status"("status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_action_history" ADD CONSTRAINT "application_action_history_decision_type_id_fkey" FOREIGN KEY ("decision_type_id") REFERENCES "decision_types"("decision_type_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_action_history" ADD CONSTRAINT "application_action_history_performed_by_user_id_fkey" FOREIGN KEY ("performed_by_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_action_history" ADD CONSTRAINT "application_action_history_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_action_history" ADD CONSTRAINT "application_action_history_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
