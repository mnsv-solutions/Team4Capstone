-- AlterTable
ALTER TABLE "customer" ADD COLUMN     "gender_id" UUID,
ADD COLUMN     "marital_status_id" UUID,
ADD COLUMN     "nationality_country_id" UUID,
ADD COLUMN     "sin_tax_id_encrypted" BYTEA,
ADD COLUMN     "sin_tax_id_masked" VARCHAR(30);

-- CreateTable
CREATE TABLE "genders" (
    "gender_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gender_code" VARCHAR(20) NOT NULL,
    "gender_name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "genders_pkey" PRIMARY KEY ("gender_id")
);

-- CreateTable
CREATE TABLE "marital_statuses" (
    "marital_status_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "marital_status_code" VARCHAR(20) NOT NULL,
    "marital_status_name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "marital_statuses_pkey" PRIMARY KEY ("marital_status_id")
);

-- CreateTable
CREATE TABLE "countries" (
    "country_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "country_code" VARCHAR(3) NOT NULL,
    "country_name" VARCHAR(100) NOT NULL,
    "nationality_name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("country_id")
);

-- CreateTable
CREATE TABLE "government_id_types" (
    "government_id_type_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "government_id_type_code" VARCHAR(30) NOT NULL,
    "government_id_type_name" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "government_id_types_pkey" PRIMARY KEY ("government_id_type_id")
);

-- CreateTable
CREATE TABLE "contact_types" (
    "contact_type_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contact_type_code" VARCHAR(30) NOT NULL,
    "contact_type_name" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "contact_types_pkey" PRIMARY KEY ("contact_type_id")
);

-- CreateTable
CREATE TABLE "income_source_types" (
    "income_source_type_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "income_source_type_code" VARCHAR(30) NOT NULL,
    "income_source_type_name" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "income_source_types_pkey" PRIMARY KEY ("income_source_type_id")
);

-- CreateTable
CREATE TABLE "liability_types" (
    "liability_type_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "liability_type_code" VARCHAR(30) NOT NULL,
    "liability_type_name" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "liability_types_pkey" PRIMARY KEY ("liability_type_id")
);

-- CreateTable
CREATE TABLE "bank_account_types" (
    "bank_account_type_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "account_type_code" VARCHAR(20) NOT NULL,
    "account_type_name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "bank_account_types_pkey" PRIMARY KEY ("bank_account_type_id")
);

-- CreateTable
CREATE TABLE "document_types" (
    "document_type_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "document_type_code" VARCHAR(30) NOT NULL,
    "document_type_name" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "document_types_pkey" PRIMARY KEY ("document_type_id")
);

-- CreateTable
CREATE TABLE "customer_contact_details" (
    "customer_contact_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "contact_type_id" UUID NOT NULL,
    "contact_value" VARCHAR(255) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "customer_contact_details_pkey" PRIMARY KEY ("customer_contact_id")
);

-- CreateTable
CREATE TABLE "customer_address_details" (
    "customer_address_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "address_type_id" UUID NOT NULL,
    "line1" VARCHAR(120) NOT NULL,
    "line2" VARCHAR(120),
    "city" VARCHAR(80) NOT NULL,
    "state_province" VARCHAR(80),
    "postal_code" VARCHAR(20),
    "country_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "customer_address_details_pkey" PRIMARY KEY ("customer_address_id")
);

-- CreateTable
CREATE TABLE "customer_employment_details" (
    "customer_employment_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "employment_type_id" UUID NOT NULL,
    "employer_name" VARCHAR(150),
    "job_title" VARCHAR(120),
    "work_experience_years" DECIMAL(5,2),
    "monthly_income" DECIMAL(12,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "customer_employment_details_pkey" PRIMARY KEY ("customer_employment_id")
);

-- CreateTable
CREATE TABLE "customer_liabilities" (
    "customer_liability_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "liability_type_id" UUID NOT NULL,
    "lender_name" VARCHAR(150),
    "account_reference_masked" VARCHAR(60),
    "monthly_payment" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "outstanding_balance" DECIMAL(14,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "customer_liabilities_pkey" PRIMARY KEY ("customer_liability_id")
);

-- CreateTable
CREATE TABLE "customer_government_id" (
    "customer_government_id_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "government_id_type_id" UUID NOT NULL,
    "government_id_number_masked" VARCHAR(80) NOT NULL,
    "government_id_number_encrypted" BYTEA NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "customer_government_id_pkey" PRIMARY KEY ("customer_government_id_id")
);

-- CreateTable
CREATE TABLE "customer_bank_details" (
    "customer_bank_detail_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "bank_id" UUID NOT NULL,
    "bank_account_type_id" UUID NOT NULL,
    "account_number_masked" VARCHAR(40) NOT NULL,
    "account_number_encrypted" BYTEA,
    "is_primary" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "customer_bank_details_pkey" PRIMARY KEY ("customer_bank_detail_id")
);

-- CreateTable
CREATE TABLE "customer_document_details" (
    "customer_document_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "document_type_id" UUID NOT NULL,
    "document_name" VARCHAR(255) NOT NULL,
    "document_path" VARCHAR(500) NOT NULL,
    "mime_type" VARCHAR(100),
    "file_size_bytes" BIGINT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "customer_document_details_pkey" PRIMARY KEY ("customer_document_id")
);

-- CreateTable
CREATE TABLE "customer_education_details" (
    "customer_education_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "education_level_id" UUID NOT NULL,
    "institution_id" UUID,
    "field_of_study" VARCHAR(150),
    "graduation_year" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "customer_education_details_pkey" PRIMARY KEY ("customer_education_id")
);

-- CreateTable
CREATE TABLE "customer_income_sources" (
    "customer_income_source_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "income_source_type_id" UUID NOT NULL,
    "monthly_amount" DECIMAL(12,2),
    "description" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "customer_income_sources_pkey" PRIMARY KEY ("customer_income_source_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "genders_gender_code_key" ON "genders"("gender_code");

-- CreateIndex
CREATE UNIQUE INDEX "genders_gender_name_key" ON "genders"("gender_name");

-- CreateIndex
CREATE UNIQUE INDEX "marital_statuses_marital_status_code_key" ON "marital_statuses"("marital_status_code");

-- CreateIndex
CREATE UNIQUE INDEX "marital_statuses_marital_status_name_key" ON "marital_statuses"("marital_status_name");

-- CreateIndex
CREATE UNIQUE INDEX "countries_country_code_key" ON "countries"("country_code");

-- CreateIndex
CREATE UNIQUE INDEX "countries_country_name_key" ON "countries"("country_name");

-- CreateIndex
CREATE UNIQUE INDEX "countries_nationality_name_key" ON "countries"("nationality_name");

-- CreateIndex
CREATE UNIQUE INDEX "government_id_types_government_id_type_code_key" ON "government_id_types"("government_id_type_code");

-- CreateIndex
CREATE UNIQUE INDEX "government_id_types_government_id_type_name_key" ON "government_id_types"("government_id_type_name");

-- CreateIndex
CREATE UNIQUE INDEX "contact_types_contact_type_code_key" ON "contact_types"("contact_type_code");

-- CreateIndex
CREATE UNIQUE INDEX "contact_types_contact_type_name_key" ON "contact_types"("contact_type_name");

-- CreateIndex
CREATE UNIQUE INDEX "income_source_types_income_source_type_code_key" ON "income_source_types"("income_source_type_code");

-- CreateIndex
CREATE UNIQUE INDEX "income_source_types_income_source_type_name_key" ON "income_source_types"("income_source_type_name");

-- CreateIndex
CREATE UNIQUE INDEX "liability_types_liability_type_code_key" ON "liability_types"("liability_type_code");

-- CreateIndex
CREATE UNIQUE INDEX "liability_types_liability_type_name_key" ON "liability_types"("liability_type_name");

-- CreateIndex
CREATE UNIQUE INDEX "bank_account_types_account_type_code_key" ON "bank_account_types"("account_type_code");

-- CreateIndex
CREATE UNIQUE INDEX "bank_account_types_account_type_name_key" ON "bank_account_types"("account_type_name");

-- CreateIndex
CREATE UNIQUE INDEX "document_types_document_type_code_key" ON "document_types"("document_type_code");

-- CreateIndex
CREATE UNIQUE INDEX "document_types_document_type_name_key" ON "document_types"("document_type_name");

-- CreateIndex
CREATE INDEX "idx_customer_contact_customer_active" ON "customer_contact_details"("customer_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "ux_customer_contact_value_active" ON "customer_contact_details"("contact_type_id", "contact_value");

-- CreateIndex
CREATE INDEX "idx_customer_address_customer_active" ON "customer_address_details"("customer_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "customer_employment_details_customer_id_key" ON "customer_employment_details"("customer_id");

-- CreateIndex
CREATE INDEX "idx_customer_liabilities_customer_active" ON "customer_liabilities"("customer_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_customer_government_id_customer_active" ON "customer_government_id"("customer_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_customer_bank_customer_active" ON "customer_bank_details"("customer_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_customer_document_customer_active" ON "customer_document_details"("customer_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_customer_education_customer_active" ON "customer_education_details"("customer_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_customer_income_source_customer_active" ON "customer_income_sources"("customer_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_customer_gender" ON "customer"("gender_id");

-- CreateIndex
CREATE INDEX "idx_customer_marital_status" ON "customer"("marital_status_id");

-- CreateIndex
CREATE INDEX "idx_customer_nationality_country" ON "customer"("nationality_country_id");

-- RenameForeignKey
ALTER TABLE "customer" RENAME CONSTRAINT "fk_customer_created_by" TO "customer_created_by_fkey";

-- RenameForeignKey
ALTER TABLE "customer" RENAME CONSTRAINT "fk_customer_updated_by" TO "customer_updated_by_fkey";

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_gender_id_fkey" FOREIGN KEY ("gender_id") REFERENCES "genders"("gender_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_marital_status_id_fkey" FOREIGN KEY ("marital_status_id") REFERENCES "marital_statuses"("marital_status_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_nationality_country_id_fkey" FOREIGN KEY ("nationality_country_id") REFERENCES "countries"("country_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_contact_details" ADD CONSTRAINT "customer_contact_details_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_contact_details" ADD CONSTRAINT "customer_contact_details_contact_type_id_fkey" FOREIGN KEY ("contact_type_id") REFERENCES "contact_types"("contact_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_address_details" ADD CONSTRAINT "customer_address_details_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_address_details" ADD CONSTRAINT "customer_address_details_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("country_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_employment_details" ADD CONSTRAINT "customer_employment_details_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_employment_details" ADD CONSTRAINT "customer_employment_details_employment_type_id_fkey" FOREIGN KEY ("employment_type_id") REFERENCES "employment_types"("employment_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_liabilities" ADD CONSTRAINT "customer_liabilities_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_liabilities" ADD CONSTRAINT "customer_liabilities_liability_type_id_fkey" FOREIGN KEY ("liability_type_id") REFERENCES "liability_types"("liability_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_government_id" ADD CONSTRAINT "customer_government_id_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_government_id" ADD CONSTRAINT "customer_government_id_government_id_type_id_fkey" FOREIGN KEY ("government_id_type_id") REFERENCES "government_id_types"("government_id_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_bank_details" ADD CONSTRAINT "customer_bank_details_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_bank_details" ADD CONSTRAINT "customer_bank_details_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("bank_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_bank_details" ADD CONSTRAINT "customer_bank_details_bank_account_type_id_fkey" FOREIGN KEY ("bank_account_type_id") REFERENCES "bank_account_types"("bank_account_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_document_details" ADD CONSTRAINT "customer_document_details_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_document_details" ADD CONSTRAINT "customer_document_details_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "document_types"("document_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_education_details" ADD CONSTRAINT "customer_education_details_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_education_details" ADD CONSTRAINT "customer_education_details_education_level_id_fkey" FOREIGN KEY ("education_level_id") REFERENCES "education_levels"("education_level_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_education_details" ADD CONSTRAINT "customer_education_details_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("institution_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_income_sources" ADD CONSTRAINT "customer_income_sources_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_income_sources" ADD CONSTRAINT "customer_income_sources_income_source_type_id_fkey" FOREIGN KEY ("income_source_type_id") REFERENCES "income_source_types"("income_source_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;
