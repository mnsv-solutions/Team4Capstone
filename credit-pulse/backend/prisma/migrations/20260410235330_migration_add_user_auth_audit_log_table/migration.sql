/*
  Warnings:

  - A unique constraint covering the columns `[role_code]` on the table `roles` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "user_auth_audit_log" (
    "auth_audit_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "login_identifier" VARCHAR(255),
    "event_type" VARCHAR(40) NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "failure_reason" VARCHAR(255),
    "ip_address" VARCHAR(80),
    "user_agent" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_auth_audit_log_pkey" PRIMARY KEY ("auth_audit_id")
);

-- CreateIndex
CREATE INDEX "idx_user_auth_audit_user_id" ON "user_auth_audit_log"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_auth_audit_event_type" ON "user_auth_audit_log"("event_type");

-- CreateIndex
CREATE INDEX "idx_user_auth_audit_created_at" ON "user_auth_audit_log"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_roles_role_code" ON "roles"("role_code");

-- AddForeignKey
ALTER TABLE "user_auth_audit_log" ADD CONSTRAINT "user_auth_audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;
