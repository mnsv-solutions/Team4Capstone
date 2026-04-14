import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';

import crypto from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service.js';
import { ApplicationStatusDto } from './dto/application-status.dto.js';

// Metadata captured for audit tracking (IP + browser info)
type AuditMeta = {
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class ApplicationStatusService {
  private readonly logger = new Logger(ApplicationStatusService.name);

  // Injecting PrismaService for database access
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves the application status for a given application number and date of birth.
   * If the application is not found, it will create an audit log with the reason code 'NOT_FOUND'.
   * If the application status is not active, it will create an audit log with the reason code 'INACTIVE_STATUS'.
   * If the primary applicant (applicant type 0) is not found or is not active, it will create an audit log with the reason code 'PRIMARY_NOT_FOUND'.
   * If the date of birth does not match the primary applicant's date of birth, it will create an audit log with the reason code 'DOB_MISMATCH'.
   * If all checks pass, it will create an audit log with the reason code 'SUCCESS' and return the application status.
   * @param dto - The application status DTO containing the application number and date of birth.
   * @param meta - The audit metadata containing the IP address and user agent.
   * @returns An object containing the success status, application number, status code, and status name.
   */
  async getApplicationStatus(dto: ApplicationStatusDto, meta: AuditMeta = {}) {
    this.logger.log('The application status check has started.');

    // Trim application number to avoid accidental spaces
    const applicationNumber = dto.applicationNumber.trim();

    this.logger.log(
      `The application record is being looked up for application number: ${applicationNumber}`,
    );

    // Hash the date of birth before storing in audit table
    const dobHash = crypto.createHash('sha256').update(dto.dob).digest('hex');

    // Find the application by application number
    const application = await this.prisma.loan_application.findFirst({
      where: { application_number: applicationNumber, is_active: true },
      select: {
        application_id: true,
        application_number: true,
        status_id: true,
        application_status: { select: { status_code: true, status_name: true, is_active: true } },
      },
    });

    // If the application is not found, create an audit log with 'NOT_FOUND' reason code
    if (!application) {
      this.logger.warn(
        `No active application record was found for application number: ${applicationNumber}`,
      );

      await this.prisma.application_status_audit.create({
        data: {
          application_number: applicationNumber,
          dob_hash: dobHash,
          success: false,
          reason_code: 'NOT_FOUND',
          ip_address: meta.ipAddress ?? null,
          user_agent: meta.userAgent ?? null,
        },
      });

      this.logger.warn(
        `An audit entry was created with reason code NOT_FOUND for application number: ${applicationNumber}`,
      );

      throw new NotFoundException({ success: false, reasonCode: 'NOT_FOUND' });
    }

    this.logger.log(
      `The application record was found for application number: ${applicationNumber}`,
    );

    // If the application status is not active, create an audit log with 'INACTIVE_STATUS' reason code
    if (!application.application_status?.is_active) {
      this.logger.warn(
        `The application was found, but its status is not active for application number: ${applicationNumber}`,
      );

      await this.prisma.application_status_audit.create({
        data: {
          application_number: applicationNumber,
          dob_hash: dobHash,
          success: false,
          reason_code: 'INACTIVE_STATUS',
          ip_address: meta.ipAddress ?? null,
          user_agent: meta.userAgent ?? null,
        },
      });

      this.logger.warn(
        `An audit entry was created with reason code INACTIVE_STATUS for application number: ${applicationNumber}`,
      );

      throw new BadRequestException({ success: false, reasonCode: 'INACTIVE_STATUS' });
    }

    this.logger.log(
      `The application status is active for application number: ${applicationNumber}`,
    );

    // Find the primary applicant (applicant type 0) by application ID
    const primaryLink = await this.prisma.sub_loan.findFirst({
      where: {
        application_id: application.application_id,
        applicant_type: 0,
        is_active: true,
      },
      select: {
        customer: { select: { date_of_birth: true, is_active: true } },
      },
    });

    // If the primary applicant is not found or is not active, create an audit log with 'PRIMARY_NOT_FOUND' reason code
    if (!primaryLink?.customer || !primaryLink.customer.is_active) {
      this.logger.warn(
        `The primary applicant details could not be verified for application number: ${applicationNumber}`,
      );

      await this.prisma.application_status_audit.create({
        data: {
          application_number: applicationNumber,
          dob_hash: dobHash,
          success: false,
          reason_code: 'PRIMARY_NOT_FOUND',
          ip_address: meta.ipAddress ?? null,
          user_agent: meta.userAgent ?? null,
        },
      });

      this.logger.warn(
        `An audit entry was created with reason code PRIMARY_NOT_FOUND for application number: ${applicationNumber}`,
      );

      throw new BadRequestException({ success: false, reasonCode: 'PRIMARY_NOT_FOUND' });
    }

    this.logger.log(
      `The primary applicant details were verified for application number: ${applicationNumber}`,
    );

    // Check if the date of birth matches the primary applicant's date of birth
    const dobInput = new Date(dto.dob);
    const dobDb = primaryLink.customer.date_of_birth;

    const sameDob =
      dobDb.getUTCFullYear() === dobInput.getUTCFullYear() &&
      dobDb.getUTCMonth() === dobInput.getUTCMonth() &&
      dobDb.getUTCDate() === dobInput.getUTCDate();

    // If the date of birth does not match, create an audit log with 'DOB_MISMATCH' reason code
    if (!sameDob) {
      this.logger.warn(
        `The provided date of birth did not match the stored record for application number: ${applicationNumber}`,
      );

      await this.prisma.application_status_audit.create({
        data: {
          application_number: applicationNumber,
          dob_hash: dobHash,
          success: false,
          reason_code: 'DOB_MISMATCH',
          ip_address: meta.ipAddress ?? null,
          user_agent: meta.userAgent ?? null,
        },
      });

      this.logger.warn(
        `An audit entry was created with reason code DOB_MISMATCH for application number: ${applicationNumber}`,
      );

      throw new BadRequestException({ success: false, reasonCode: 'DOB_MISMATCH' });
    }

    this.logger.log(
      `The provided details matched successfully for application number: ${applicationNumber}`,
    );

    // If all checks pass, create an audit log with 'SUCCESS' reason code and return the application status
    await this.prisma.application_status_audit.create({
      data: {
        application_number: applicationNumber,
        dob_hash: dobHash,
        success: true,
        reason_code: 'SUCCESS',
        ip_address: meta.ipAddress ?? null,
        user_agent: meta.userAgent ?? null,
      },
    });

    this.logger.log(
      `The application status was returned successfully for application number: ${applicationNumber}`,
    );

    // Return application status details to user
    return {
      success: true,
      applicationNumber: application.application_number,
      statusCode: application.application_status.status_code,
      statusName: application.application_status.status_name,
    };
  }
}
