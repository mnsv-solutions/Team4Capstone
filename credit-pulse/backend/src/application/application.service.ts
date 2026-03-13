import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { JwtPayload } from '../types/jwtpayload.js';
import { CreateApplicationDto } from './dto/createApplication.dto.js';
import { CreateApplicationResponseDto } from './dto/createApplicationResponse.dto.js';

@Injectable()
export class ApplicationService {
  constructor(private readonly prisma: PrismaService) {}

  async createApplication(
    createApplicationDto: CreateApplicationDto,
    currentUser: JwtPayload,
  ): Promise<CreateApplicationResponseDto> {
    if (createApplicationDto.email !== currentUser.email) {
      throw new BadRequestException('Email in the form does not match the authenticated user.');
    }

    return await this.prisma.$transaction(async (tx) => {
      const userId = currentUser.sub;

      const status =
        (await tx.application_status.findFirst({
          where: {
            is_active: true,
            status_code: {
              in: ['SUBMITTED', 'PENDING', 'NEW'],
            },
          },
          select: { status_id: true },
          orderBy: { created_at: 'asc' },
        })) ??
        (await tx.application_status.create({
          data: {
            status_code: 'SUBMITTED',
            status_name: 'Submitted',
          },
          select: { status_id: true },
        }));

      const addressType =
        (await tx.address_types.findFirst({
          where: {
            is_active: true,
            address_type_code: {
              in: ['HOME', 'RESIDENTIAL', 'CURRENT'],
            },
          },
          select: { address_type_id: true },
          orderBy: { created_at: 'asc' },
        })) ??
        (await tx.address_types.create({
          data: {
            address_type_code: 'HOME',
            address_type_name: 'Home Address',
          },
          select: { address_type_id: true },
        }));

      const educationLevel =
        (await tx.education_levels.findFirst({
          where: {
            is_active: true,
            level_name: {
              equals: createApplicationDto.highestEducation,
              mode: 'insensitive',
            },
          },
          select: { education_level_id: true },
        })) ??
        (await tx.education_levels.create({
          data: {
            level_code: this.generateReferenceCode('EDU', createApplicationDto.highestEducation),
            level_name: createApplicationDto.highestEducation,
          },
          select: { education_level_id: true },
        }));

      const institution =
        (await tx.institutions.findFirst({
          where: {
            is_active: true,
            institution_name: {
              equals: createApplicationDto.institution,
              mode: 'insensitive',
            },
          },
          select: { institution_id: true },
        })) ??
        (await tx.institutions.create({
          data: {
            institution_name: createApplicationDto.institution,
            city: createApplicationDto.city,
            country: 'Canada',
          },
          select: { institution_id: true },
        }));

      const employmentType =
        (await tx.employment_types.findFirst({
          where: {
            is_active: true,
            employment_type_name: {
              equals: createApplicationDto.employmentStatus,
              mode: 'insensitive',
            },
          },
          select: { employment_type_id: true },
        })) ??
        (await tx.employment_types.create({
          data: {
            employment_type_code: this.generateReferenceCode(
              'EMP',
              createApplicationDto.employmentStatus,
            ),
            employment_type_name: createApplicationDto.employmentStatus,
          },
          select: { employment_type_id: true },
        }));

      await tx.user_profile.create({
        data: {
          user_id: userId,
          date_of_birth: new Date(createApplicationDto.dob),
          gender: createApplicationDto.gender,
          marital_status: createApplicationDto.maritalStatus,
          government_id_type: 'GOVERNMENT_ID',
          government_id_number: createApplicationDto.governmentIdNumber,
          created_by: userId,
        },
      });

      await tx.user_address.create({
        data: {
          user_id: userId,
          address_type_id: addressType.address_type_id,
          line1: createApplicationDto.address,
          city: createApplicationDto.city,
          postal_code: createApplicationDto.postalCode,
          country: 'Canada',
          is_primary: true,
          created_by: userId,
        },
      });

      await tx.user_education.create({
        data: {
          user_id: userId,
          education_level_id: educationLevel.education_level_id,
          institution_id: institution.institution_id,
          end_date: new Date(Date.UTC(createApplicationDto.graduationYear, 5, 30)),
          created_by: userId,
        },
      });

      await tx.user_employment.create({
        data: {
          user_id: userId,
          employment_type_id: employmentType.employment_type_id,
          employer_name: createApplicationDto.employerName,
          monthly_income: createApplicationDto.monthlyIncome,
          created_by: userId,
        },
      });

      const customer = await tx.customer.create({
        data: {
          first_name: createApplicationDto.firstName,
          last_name: createApplicationDto.lastName,
          date_of_birth: new Date(createApplicationDto.dob),
          created_by: userId,
        },
        select: { customer_id: true },
      });

      const applicationNumber = await this.generateUniqueApplicationNumber(tx);

      const loanApplication = await tx.loan_application.create({
        data: {
          application_number: applicationNumber,
          status_id: status.status_id,
          created_by: userId,
        },
        select: { application_id: true },
      });

      await tx.sub_loan.create({
        data: {
          application_id: loanApplication.application_id,
          customer_id: customer.customer_id,
          applicant_type: 0,
          created_by: userId,
        },
      });

      return {
        applicationId: loanApplication.application_id,
        message: 'Application created successfully.',
      };
    });
  }

  private generateReferenceCode(prefix: string, source: string): string {
    const normalized = source
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const suffix = Date.now().toString(36).toUpperCase().slice(-6);
    const base = `${prefix}_${normalized}`.slice(0, 23);

    return `${base}_${suffix}`;
  }

  private async generateUniqueApplicationNumber(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
  ): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = this.generateApplicationNumber();
      const exists = await tx.loan_application.findUnique({
        where: { application_number: candidate },
        select: { application_id: true },
      });

      if (!exists) {
        return candidate;
      }
    }

    throw new InternalServerErrorException('Failed to generate a unique application number.');
  }

  private generateApplicationNumber(): string {
    const timestampPart = Date.now().toString().slice(-6);
    const randomPart = Math.floor(Math.random() * 10_000)
      .toString()
      .padStart(4, '0');

    return `APPL${timestampPart}${randomPart}`;
  }
}
