-- CreateTable
CREATE TABLE "loan_product_config" (
    "product_config_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "loan_type_id" UUID NOT NULL,
    "min_amount" DECIMAL(12,2) NOT NULL,
    "max_amount" DECIMAL(12,2) NOT NULL,
    "min_tenure_months" INTEGER NOT NULL,
    "max_tenure_months" INTEGER NOT NULL,
    "min_interest_rate" DECIMAL(5,2) NOT NULL,
    "max_interest_rate" DECIMAL(5,2) NOT NULL,
    "processing_fee_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "loan_product_config_pkey" PRIMARY KEY ("product_config_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_loan_product_config_loan_type_id" ON "loan_product_config"("loan_type_id");

-- CreateIndex
CREATE INDEX "idx_loan_product_config_is_active" ON "loan_product_config"("is_active");

-- AddForeignKey
ALTER TABLE "loan_product_config" ADD CONSTRAINT "fk_loan_product_config_loan_type" FOREIGN KEY ("loan_type_id") REFERENCES "loan_types"("loan_type_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "loan_product_config" ADD CONSTRAINT "fk_loan_product_config_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "loan_product_config" ADD CONSTRAINT "fk_loan_product_config_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;
