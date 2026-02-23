import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

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
    // Trim application number to avoid accidental spaces
    const applicationNumber = dto.applicationNumber.trim();

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

      throw new NotFoundException({ success: false, reasonCode: 'NOT_FOUND' });
    }

    // If the application status is not active, create an audit log with 'INACTIVE_STATUS' reason code
    if (!application.application_status?.is_active) {
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

      throw new BadRequestException({ success: false, reasonCode: 'INACTIVE_STATUS' });
    }

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

      throw new BadRequestException({ success: false, reasonCode: 'PRIMARY_NOT_FOUND' });
    }

    // Check if the date of birth matches the primary applicant's date of birth
    const dobInput = new Date(dto.dob);
    const dobDb = primaryLink.customer.date_of_birth;

    const sameDob =
      dobDb.getUTCFullYear() === dobInput.getUTCFullYear() &&
      dobDb.getUTCMonth() === dobInput.getUTCMonth() &&
      dobDb.getUTCDate() === dobInput.getUTCDate();

    // If the date of birth does not match, create an audit log with 'DOB_MISMATCH' reason code
    if (!sameDob) {
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

      throw new BadRequestException({ success: false, reasonCode: 'DOB_MISMATCH' });
    }

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

    // Return application status details to user
    return {
      success: true,
      applicationNumber: application.application_number,
      statusCode: application.application_status.status_code,
      statusName: application.application_status.status_name,
    };
  }
}
