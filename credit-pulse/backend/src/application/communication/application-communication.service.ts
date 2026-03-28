import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';
import { GetApplicationCommunicationHistoryDto } from './dto/get-application-communication-history.dto.js';
import { SendApplicationCommunicationDto } from './dto/send-application-communication.dto.js';

@Injectable()
export class ApplicationCommunicationService {
  // Gives this service access to database operations
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new communication record in the database along with any attachments.
   *
   * Verifies that the application exists and is active. Also confirms that the logged-in sender is a valid active internal user.
   * If the recipient type is CUSTOMER, automatically selects the primary customer of the application if the recipient user id is not provided.
   * If the recipient type is not CUSTOMER, verifies that the selected internal recipient user exists and is active.
   *
   * @param dto - The communication data to be saved.
   * @param userId - The id of the logged-in user.
   * @returns A promise resolving to a response containing a success message.
   * @throws BadRequestException - If the application or recipient user is invalid.
   * @throws NotFoundException - If the application or sender user is not found.
   * @throws ForbiddenException - If the sender user is not a valid active internal user.
   */
  async createCommunication(dto: SendApplicationCommunicationDto, userId: string) {
    // Finds the active application using the application number
    const application = await this.prisma.loan_application.findFirst({
      where: {
        application_number: dto.applicationNumber,
        is_active: true,
      },
      select: {
        application_id: true,
        application_number: true,
      },
    });

    // Stops the flow if the application does not exist
    if (!application) {
      throw new NotFoundException('Application not found.');
    }

    // Confirms the logged-in sender is a valid active internal user
    const senderUser = await this.prisma.users.findFirst({
      where: {
        user_id: userId,
        is_active: true,
      },
      select: {
        user_id: true,
      },
    });

    // Blocks the request if the sender record is missing
    if (!senderUser) {
      throw new ForbiddenException('Authenticated sender not found.');
    }

    // Makes sure message text is present after trimming spaces
    if (!dto.messageText?.trim()) {
      throw new BadRequestException('messageText is required.');
    }

    // Internal logged-in users are not allowed to send as customer
    if (dto.senderType === 'CUSTOMER') {
      throw new ForbiddenException('Logged-in internal user cannot send as CUSTOMER.');
    }

    // Internal messages cannot be addressed to the customer
    if (dto.isInternal && dto.recipientType === 'CUSTOMER') {
      throw new BadRequestException('Internal message cannot be sent to CUSTOMER.');
    }

    // Internal recipients must always have a user id
    if (dto.recipientType !== 'CUSTOMER' && !dto.recipientUserId) {
      throw new BadRequestException('recipientUserId is required for internal recipient types.');
    }

    // Starts with the passed recipient id if one was provided
    let resolvedRecipientUserId = dto.recipientUserId ?? null;

    // Automatically picks the primary customer when customer recipient id is not passed
    if (dto.recipientType === 'CUSTOMER' && !resolvedRecipientUserId) {
      const primaryCustomer = await this.prisma.sub_loan.findFirst({
        where: {
          application_id: application.application_id,
          applicant_type: 0,
          is_active: true,
        },
        select: {
          customer_id: true,
        },
      });

      // Fails if the application has no active primary customer
      if (!primaryCustomer) {
        throw new BadRequestException('Primary customer not found for this application.');
      }

      resolvedRecipientUserId = primaryCustomer.customer_id;
    }

    // Verifies that the selected customer belongs to this application
    if (dto.recipientType === 'CUSTOMER' && resolvedRecipientUserId) {
      const recipientCustomer = await this.prisma.sub_loan.findFirst({
        where: {
          application_id: application.application_id,
          customer_id: resolvedRecipientUserId,
          is_active: true,
        },
        select: {
          sub_loan_id: true,
        },
      });

      // Prevents sending to a customer not linked with this application
      if (!recipientCustomer) {
        throw new BadRequestException('Recipient customer is not linked to this application.');
      }
    }

    // Verifies that the internal recipient user exists and is active
    if (dto.recipientType !== 'CUSTOMER' && resolvedRecipientUserId) {
      const recipientUser = await this.prisma.users.findFirst({
        where: {
          user_id: resolvedRecipientUserId,
          is_active: true,
        },
        select: {
          user_id: true,
        },
      });

      // Stops the request if the internal recipient is invalid
      if (!recipientUser) {
        throw new BadRequestException('Recipient internal user not found.');
      }
    }

    // Saves the communication and attachments together in one transaction
    await this.prisma.$transaction(async (tx) => {
      // Creates the main communication record
      const communication = await tx.application_communication_history.create({
        data: {
          application_id: application.application_id,
          sender_user_id: userId,
          sender_type: dto.senderType,
          recipient_user_id: resolvedRecipientUserId,
          recipient_type: dto.recipientType,
          message_text: dto.messageText.trim(),
          message_category: dto.messageCategory,
          is_internal: dto.isInternal,
          send_email: dto.sendEmail,
          send_sms: dto.sendSms,
          email_status: dto.sendEmail ? 'QUEUED' : 'NOT_REQUESTED',
          sms_status: dto.sendSms ? 'QUEUED' : 'NOT_REQUESTED',
          has_attachment: (dto.attachments?.length ?? 0) > 0,
          created_by: userId,
          updated_by: userId,
          is_deleted: false,
        },
      });

      // Creates attachment rows only when files are included
      if (dto.attachments?.length) {
        await tx.application_message_attachment.createMany({
          data: dto.attachments.map((attachment) => ({
            message_id: communication.message_id,
            application_id: application.application_id,
            document_name: attachment.documentName,
            original_file_name: attachment.originalFileName,
            document_path: attachment.documentPath,
            mime_type: attachment.mimeType ?? null,
            file_size_bytes:
              attachment.fileSizeBytes !== undefined ? BigInt(attachment.fileSizeBytes) : null,
            uploaded_by: userId,
            is_active: true,
            is_deleted: false,
          })),
        });
      }
    });

    // Triggers notification handling after data is saved
    this.queueNotifications(dto.applicationNumber, dto);

    return {
      success: true,
      message: 'Communication sent successfully',
    };
  }

  /**
   * Fetches the communication history for an application.
   *
   * @param dto - Request data containing the application number and internal recipient flag.
   * @param userId - The authenticated user ID.
   * @returns A promise resolving to an API-friendly response containing the communication history.
   * @throws NotFoundException - If the application is not found.
   * @throws ForbiddenException - If the authenticated user is missing or inactive.
   */
  async getCommunicationHistory(dto: GetApplicationCommunicationHistoryDto, userId: string) {
    // Finds the active application for which history is requested
    const application = await this.prisma.loan_application.findFirst({
      where: {
        application_number: dto.applicationNumber,
        is_active: true,
      },
      select: {
        application_id: true,
        application_number: true,
      },
    });

    // Stops the flow if the application is not found
    if (!application) {
      throw new NotFoundException('Application not found.');
    }

    // Confirms the logged-in user exists and is active
    const senderUser = await this.prisma.users.findFirst({
      where: {
        user_id: userId,
        is_active: true,
      },
      select: {
        user_id: true,
      },
    });

    // Blocks access if the authenticated user is missing
    if (!senderUser) {
      throw new ForbiddenException('Authenticated user not found.');
    }

    // Fetches communication history with active, non-deleted attachments
    const communications = await this.prisma.application_communication_history.findMany({
      where: {
        application_id: application.application_id,
        is_internal: dto.is_internal,
        is_deleted: false,
      },
      include: {
        message_attachments: {
          where: {
            is_deleted: false,
            is_active: true,
          },
          orderBy: {
            created_at: 'asc',
          },
        },
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    // Returns the communication history in API-friendly response format
    return {
      success: true,
      message: 'Communication history fetched successfully',
      data: {
        applicationNumber: application.application_number,
        is_internal: dto.is_internal,
        totalRecords: communications.length,
        communications: communications.map((item) => ({
          messageId: item.message_id,
          senderUserId: item.sender_user_id,
          senderType: item.sender_type,
          recipientUserId: item.recipient_user_id,
          recipientType: item.recipient_type,
          messageText: item.message_text,
          messageCategory: item.message_category,
          is_internal: item.is_internal,
          sendEmail: item.send_email,
          sendSms: item.send_sms,
          emailStatus: item.email_status,
          smsStatus: item.sms_status,
          hasAttachment: item.has_attachment,
          createdAt: item.created_at,
          attachments: item.message_attachments.map((attachment) => ({
            attachmentId: attachment.attachment_id,
            documentName: attachment.document_name,
            originalFileName: attachment.original_file_name,
            documentPath: attachment.document_path,
            mimeType: attachment.mime_type,
            fileSizeBytes:
              attachment.file_size_bytes !== null ? Number(attachment.file_size_bytes) : null,
            uploadedBy: attachment.uploaded_by,
            createdAt: attachment.created_at,
          })),
        })),
      },
    };
  }

  /**
   * Queue notifications for the given application communication
   * @param applicationNumber - Loan application number
   * @param dto - SendApplicationCommunicationDto
   * @description This function is used to queue notifications for the given application communication.
   * It will only queue notifications if either the sendEmail or sendSms option is set to true.
   * The function will log the notification details to the console until actual email and SMS queue integration is added.
   */
  private queueNotifications(applicationNumber: string, dto: SendApplicationCommunicationDto) {
    // Nothing to queue when both notification options are off
    if (!dto.sendEmail && !dto.sendSms) {
      return;
    }

    // Placeholder log until actual email and SMS queue integration is added
    console.log('Queue notification for communication', {
      applicationNumber,
      sendEmail: dto.sendEmail,
      sendSms: dto.sendSms,
      recipientType: dto.recipientType,
    });
  }
}
