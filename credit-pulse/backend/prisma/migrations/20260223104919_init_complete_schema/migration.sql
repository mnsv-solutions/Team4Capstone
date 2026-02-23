-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "address_types" (
    "address_type_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "address_type_code" VARCHAR(30) NOT NULL,
    "address_type_name" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "address_types_pkey" PRIMARY KEY ("address_type_id")
);

-- CreateTable
CREATE TABLE "application_status" (
    "status_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "status_code" VARCHAR(30) NOT NULL,
    "status_name" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "application_status_pkey" PRIMARY KEY ("status_id")
);

-- CreateTable
CREATE TABLE "application_status_audit" (
    "audit_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_number" VARCHAR(40) NOT NULL,
    "dob_hash" VARCHAR(128) NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "reason_code" VARCHAR(30) NOT NULL DEFAULT 'UNKNOWN',
    "ip_address" VARCHAR(80),
    "user_agent" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_status_audit_pkey" PRIMARY KEY ("audit_id")
);

-- CreateTable
CREATE TABLE "banks" (
    "bank_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bank_code" VARCHAR(30) NOT NULL,
    "bank_name" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "banks_pkey" PRIMARY KEY ("bank_id")
);

-- CreateTable
CREATE TABLE "customer" (
    "customer_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "first_name" VARCHAR(80) NOT NULL,
    "last_name" VARCHAR(80) NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("customer_id")
);

-- CreateTable
CREATE TABLE "decision_types" (
    "decision_type_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "decision_code" VARCHAR(20) NOT NULL,
    "decision_name" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "decision_types_pkey" PRIMARY KEY ("decision_type_id")
);

-- CreateTable
CREATE TABLE "education_levels" (
    "education_level_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "level_code" VARCHAR(30) NOT NULL,
    "level_name" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "education_levels_pkey" PRIMARY KEY ("education_level_id")
);

-- CreateTable
CREATE TABLE "employment_types" (
    "employment_type_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employment_type_code" VARCHAR(30) NOT NULL,
    "employment_type_name" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "employment_types_pkey" PRIMARY KEY ("employment_type_id")
);

-- CreateTable
CREATE TABLE "institutions" (
    "institution_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "institution_name" VARCHAR(150) NOT NULL,
    "city" VARCHAR(80),
    "country" VARCHAR(80),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "institutions_pkey" PRIMARY KEY ("institution_id")
);

-- CreateTable
CREATE TABLE "loan_application" (
    "application_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_number" VARCHAR(40) NOT NULL,
    "status_id" UUID NOT NULL,
    "loan_type_id" UUID,
    "requested_amount" DECIMAL(12,2),
    "tenure_months" INTEGER,
    "interest_rate" DECIMAL(5,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "loan_application_pkey" PRIMARY KEY ("application_id")
);

-- CreateTable
CREATE TABLE "loan_types" (
    "loan_type_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "loan_type_code" VARCHAR(30) NOT NULL,
    "loan_type_name" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "loan_types_pkey" PRIMARY KEY ("loan_type_id")
);

-- CreateTable
CREATE TABLE "roles" (
    "role_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role_code" VARCHAR(30) NOT NULL,
    "role_name" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "sub_loan" (
    "sub_loan_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "applicant_type" SMALLINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sub_loan_pkey" PRIMARY KEY ("sub_loan_id")
);

-- CreateTable
CREATE TABLE "user_address" (
    "address_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "address_type_id" UUID NOT NULL,
    "line1" VARCHAR(120) NOT NULL,
    "line2" VARCHAR(120),
    "city" VARCHAR(80) NOT NULL,
    "state_province" VARCHAR(80),
    "postal_code" VARCHAR(20),
    "country" VARCHAR(80) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_address_pkey" PRIMARY KEY ("address_id")
);

-- CreateTable
CREATE TABLE "user_bank_account" (
    "bank_account_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "bank_id" UUID NOT NULL,
    "account_holder_name" VARCHAR(120) NOT NULL,
    "account_number" VARCHAR(40) NOT NULL,
    "account_type" VARCHAR(30),
    "ifsc_routing_code" VARCHAR(30),
    "branch_name" VARCHAR(120),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_bank_account_pkey" PRIMARY KEY ("bank_account_id")
);

-- CreateTable
CREATE TABLE "user_education" (
    "user_education_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "education_level_id" UUID NOT NULL,
    "institution_id" UUID,
    "program_name" VARCHAR(150),
    "start_date" DATE,
    "end_date" DATE,
    "grade_percent" DECIMAL(5,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_education_pkey" PRIMARY KEY ("user_education_id")
);

-- CreateTable
CREATE TABLE "user_employment" (
    "employment_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "employment_type_id" UUID,
    "employer_name" VARCHAR(150),
    "job_title" VARCHAR(120),
    "monthly_income" DECIMAL(12,2),
    "start_date" DATE,
    "end_date" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_employment_pkey" PRIMARY KEY ("employment_id")
);

-- CreateTable
CREATE TABLE "user_profile" (
    "profile_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "date_of_birth" DATE,
    "gender" VARCHAR(20),
    "marital_status" VARCHAR(20),
    "nationality" VARCHAR(80),
    "government_id_type" VARCHAR(30),
    "government_id_number" VARCHAR(80),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_profile_pkey" PRIMARY KEY ("profile_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role_id" UUID NOT NULL,
    "first_name" VARCHAR(80) NOT NULL,
    "last_name" VARCHAR(80) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "last_login_at" TIMESTAMPTZ(6),
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(6),
    "password_changed_at" TIMESTAMPTZ(6),
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_system_user" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ux_address_types_code_active" ON "address_types"("address_type_code");

-- CreateIndex
CREATE INDEX "idx_address_types_is_active" ON "address_types"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "ux_application_status_code_active" ON "application_status"("status_code");

-- CreateIndex
CREATE INDEX "idx_application_status_is_active" ON "application_status"("is_active");

-- CreateIndex
CREATE INDEX "idx_status_audit_app_number" ON "application_status_audit"("application_number");

-- CreateIndex
CREATE INDEX "idx_status_audit_created_at" ON "application_status_audit"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ux_banks_code_active" ON "banks"("bank_code");

-- CreateIndex
CREATE INDEX "idx_banks_is_active" ON "banks"("is_active");

-- CreateIndex
CREATE INDEX "idx_customer_active" ON "customer"("is_active");

-- CreateIndex
CREATE INDEX "idx_customer_dob" ON "customer"("date_of_birth");

-- CreateIndex
CREATE UNIQUE INDEX "ux_decision_types_code_active" ON "decision_types"("decision_code");

-- CreateIndex
CREATE INDEX "idx_decision_types_is_active" ON "decision_types"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "ux_education_levels_code_active" ON "education_levels"("level_code");

-- CreateIndex
CREATE INDEX "idx_education_levels_is_active" ON "education_levels"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "ux_employment_types_code_active" ON "employment_types"("employment_type_code");

-- CreateIndex
CREATE INDEX "idx_employment_types_is_active" ON "employment_types"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "ux_institutions_name_active" ON "institutions"("institution_name");

-- CreateIndex
CREATE INDEX "idx_institutions_is_active" ON "institutions"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "uq_loan_application_number" ON "loan_application"("application_number");

-- CreateIndex
CREATE INDEX "idx_loan_application_active" ON "loan_application"("is_active");

-- CreateIndex
CREATE INDEX "idx_loan_application_status" ON "loan_application"("status_id");

-- CreateIndex
CREATE UNIQUE INDEX "ux_loan_types_code_active" ON "loan_types"("loan_type_code");

-- CreateIndex
CREATE INDEX "idx_loan_types_is_active" ON "loan_types"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "ux_roles_role_code_active" ON "roles"("role_code");

-- CreateIndex
CREATE INDEX "idx_roles_is_active" ON "roles"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "ux_sub_loan_one_primary_per_application" ON "sub_loan"("application_id");

-- CreateIndex
CREATE INDEX "idx_sub_loan_lookup" ON "sub_loan"("application_id", "applicant_type", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "ux_sub_loan_app_customer_active" ON "sub_loan"("application_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "ux_user_address_one_primary_active" ON "user_address"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_address_primary" ON "user_address"("user_id", "is_primary");

-- CreateIndex
CREATE INDEX "idx_user_address_user_active" ON "user_address"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_user_bank_accounts_user_active" ON "user_bank_account"("user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "ux_user_bank_accounts_user_number_active" ON "user_bank_account"("user_id", "account_number");

-- CreateIndex
CREATE INDEX "idx_user_education_user_active" ON "user_education"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_user_employment_user_active" ON "user_employment"("user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "user_profile_user_id_key" ON "user_profile"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_profile_active" ON "user_profile"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "ux_user_profile_govt_id_active" ON "user_profile"("government_id_type", "government_id_number");

-- CreateIndex
CREATE UNIQUE INDEX "uq_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_role_active" ON "users"("role_id", "is_active");

-- AddForeignKey
ALTER TABLE "address_types" ADD CONSTRAINT "fk_address_types_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "address_types" ADD CONSTRAINT "fk_address_types_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "application_status" ADD CONSTRAINT "fk_application_status_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "application_status" ADD CONSTRAINT "fk_application_status_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "banks" ADD CONSTRAINT "fk_banks_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "banks" ADD CONSTRAINT "fk_banks_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "fk_customer_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "fk_customer_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "decision_types" ADD CONSTRAINT "fk_decision_types_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "decision_types" ADD CONSTRAINT "fk_decision_types_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "education_levels" ADD CONSTRAINT "fk_education_levels_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "education_levels" ADD CONSTRAINT "fk_education_levels_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employment_types" ADD CONSTRAINT "fk_employment_types_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employment_types" ADD CONSTRAINT "fk_employment_types_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "institutions" ADD CONSTRAINT "fk_institutions_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "institutions" ADD CONSTRAINT "fk_institutions_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "loan_application" ADD CONSTRAINT "fk_loan_application_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "loan_application" ADD CONSTRAINT "fk_loan_application_loan_type" FOREIGN KEY ("loan_type_id") REFERENCES "loan_types"("loan_type_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "loan_application" ADD CONSTRAINT "fk_loan_application_status" FOREIGN KEY ("status_id") REFERENCES "application_status"("status_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "loan_application" ADD CONSTRAINT "fk_loan_application_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "loan_types" ADD CONSTRAINT "fk_loan_types_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "loan_types" ADD CONSTRAINT "fk_loan_types_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "fk_roles_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "fk_roles_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sub_loan" ADD CONSTRAINT "fk_sub_loan_application" FOREIGN KEY ("application_id") REFERENCES "loan_application"("application_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sub_loan" ADD CONSTRAINT "fk_sub_loan_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sub_loan" ADD CONSTRAINT "fk_sub_loan_customer" FOREIGN KEY ("customer_id") REFERENCES "customer"("customer_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sub_loan" ADD CONSTRAINT "fk_sub_loan_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_bank_account" ADD CONSTRAINT "fk_user_bank_accounts_user" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;
