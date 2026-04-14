-- CreateTable
CREATE TABLE "application_communication_history" (
    "message_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL,
    "sender_user_id" UUID NOT NULL,
    "sender_type" VARCHAR(30) NOT NULL,
    "recipient_user_id" UUID,
    "recipient_type" VARCHAR(30),
    "message_text" TEXT,
    "message_category" VARCHAR(30) NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "send_email" BOOLEAN NOT NULL DEFAULT false,
    "send_sms" BOOLEAN NOT NULL DEFAULT false,
    "email_status" VARCHAR(20) DEFAULT 'NOT_REQUESTED',
    "sms_status" VARCHAR(20) DEFAULT 'NOT_REQUESTED',
    "has_attachment" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "application_communication_history_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "application_message_attachment" (
    "attachment_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "message_id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "document_name" VARCHAR(255) NOT NULL,
    "original_file_name" VARCHAR(255) NOT NULL,
    "document_path" VARCHAR(500) NOT NULL,
    "mime_type" VARCHAR(100),
    "file_size_bytes" BIGINT,
    "uploaded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "application_message_attachment_pkey" PRIMARY KEY ("attachment_id")
);

-- CreateIndex
CREATE INDEX "idx_application_communication_history_application_id" ON "application_communication_history"("application_id");

-- CreateIndex
CREATE INDEX "idx_application_communication_history_sender_user_id" ON "application_communication_history"("sender_user_id");

-- CreateIndex
CREATE INDEX "idx_application_communication_history_created_at" ON "application_communication_history"("created_at");

-- CreateIndex
CREATE INDEX "idx_application_communication_history_is_internal" ON "application_communication_history"("is_internal");

-- CreateIndex
CREATE INDEX "idx_application_message_attachment_message_id" ON "application_message_attachment"("message_id");

-- CreateIndex
CREATE INDEX "idx_application_message_attachment_application_id" ON "application_message_attachment"("application_id");

-- AddForeignKey
ALTER TABLE "application_communication_history" ADD CONSTRAINT "application_communication_history_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "loan_application"("application_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "application_message_attachment" ADD CONSTRAINT "application_message_attachment_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "application_communication_history"("message_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_message_attachment" ADD CONSTRAINT "application_message_attachment_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "loan_application"("application_id") ON DELETE RESTRICT ON UPDATE NO ACTION;
