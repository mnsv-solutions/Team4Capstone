-- CreateTable
CREATE TABLE "application_assignment" (
    "assignment_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL,
    "assigned_team_id" UUID,
    "assigned_user_id" UUID,
    "assignment_status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" UUID NOT NULL,
    "unassigned_at" TIMESTAMPTZ(6),
    "unassigned_by" UUID,
    "remarks" TEXT,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "application_assignment_pkey" PRIMARY KEY ("assignment_id")
);

-- CreateIndex
CREATE INDEX "idx_application_assignment_application" ON "application_assignment"("application_id");

-- CreateIndex
CREATE INDEX "idx_application_assignment_team" ON "application_assignment"("assigned_team_id");

-- CreateIndex
CREATE INDEX "idx_application_assignment_user" ON "application_assignment"("assigned_user_id");

-- CreateIndex
CREATE INDEX "idx_application_assignment_current" ON "application_assignment"("is_current");

-- CreateIndex
CREATE INDEX "idx_application_assignment_application_current" ON "application_assignment"("application_id", "is_current");

-- CreateIndex
CREATE INDEX "idx_application_assignment_team_current" ON "application_assignment"("assigned_team_id", "is_current");

-- CreateIndex
CREATE INDEX "idx_application_assignment_user_current" ON "application_assignment"("assigned_user_id", "is_current");

-- AddForeignKey
ALTER TABLE "application_assignment" ADD CONSTRAINT "application_assignment_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "loan_application"("application_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "application_assignment" ADD CONSTRAINT "application_assignment_assigned_team_id_fkey" FOREIGN KEY ("assigned_team_id") REFERENCES "teams"("team_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "application_assignment" ADD CONSTRAINT "application_assignment_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "application_assignment" ADD CONSTRAINT "application_assignment_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "application_assignment" ADD CONSTRAINT "application_assignment_unassigned_by_fkey" FOREIGN KEY ("unassigned_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "application_assignment" ADD CONSTRAINT "application_assignment_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "application_assignment" ADD CONSTRAINT "application_assignment_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION;
