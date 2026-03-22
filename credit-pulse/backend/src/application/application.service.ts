import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import * as bcrypt from 'bcrypt';

import { JwtPayload } from '../common/types/jwtpayload.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateApplicationRequestDto } from './dto/createApplicationRequest.dto.js';
import { CreateApplicationResponseDto } from './dto/createApplicationResponse.dto.js';

@Injectable()
export class ApplicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async createApplication(
    createApplicationDto: CreateApplicationRequestDto,
    currentUser: JwtPayload,
  ): Promise<CreateApplicationResponseDto> {
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

      const gender =
        (await tx.genders.findFirst({
          where: {
            is_active: true,
            gender_name: {
              equals: createApplicationDto.gender,
              mode: 'insensitive',
            },
          },
          select: { gender_id: true },
        })) ??
        (await tx.genders.create({
          data: {
            gender_code: this.generateReferenceCode('GEN', createApplicationDto.gender),
            gender_name: createApplicationDto.gender,
          },
          select: { gender_id: true },
        }));

      const maritalStatus =
        (await tx.marital_statuses.findFirst({
          where: {
            is_active: true,
            marital_status_name: {
              equals: createApplicationDto.maritalStatus,
              mode: 'insensitive',
            },
          },
          select: { marital_status_id: true },
        })) ??
        (await tx.marital_statuses.create({
          data: {
            marital_status_code: this.generateReferenceCode(
              'MAR',
              createApplicationDto.maritalStatus,
            ),
            marital_status_name: createApplicationDto.maritalStatus,
          },
          select: { marital_status_id: true },
        }));

      const country =
        (await tx.countries.findFirst({
          where: {
            is_active: true,
            country_name: {
              equals: 'Canada',
              mode: 'insensitive',
            },
          },
          select: { country_id: true },
        })) ??
        (await tx.countries.create({
          data: {
            country_code: 'CAN',
            country_name: 'Canada',
            nationality_name: 'Canadian',
          },
          select: { country_id: true },
        }));

      const governmentIdType =
        (await tx.government_id_types.findFirst({
          where: {
            is_active: true,
            government_id_type_name: {
              equals: 'GOVERNMENT_ID',
              mode: 'insensitive',
            },
          },
          select: { government_id_type_id: true },
        })) ??
        (await tx.government_id_types.create({
          data: {
            government_id_type_code: 'GOV_ID',
            government_id_type_name: 'GOVERNMENT_ID',
          },
          select: { government_id_type_id: true },
        }));

      const customer = await tx.customer.create({
        data: {
          first_name: createApplicationDto.firstName,
          last_name: createApplicationDto.lastName,
          date_of_birth: new Date(createApplicationDto.dob),
          gender_id: gender.gender_id,
          marital_status_id: maritalStatus.marital_status_id,
          nationality_country_id: country.country_id,
          created_by: userId,
        },
        select: { customer_id: true },
      });

      await tx.customer_address_details.create({
        data: {
          customer_id: customer.customer_id,
          address_type_id: addressType.address_type_id,
          line1: createApplicationDto.address,
          city: createApplicationDto.city,
          postal_code: createApplicationDto.postalCode,
          country_id: country.country_id,
          is_primary: true,
        },
      });

      await tx.customer_education_details.create({
        data: {
          customer_id: customer.customer_id,
          education_level_id: educationLevel.education_level_id,
          institution_id: institution.institution_id,
          graduation_year: createApplicationDto.graduationYear,
        },
      });

      await tx.customer_employment_details.create({
        data: {
          customer_id: customer.customer_id,
          employment_type_id: employmentType.employment_type_id,
          employer_name: createApplicationDto.employerName,
          monthly_income: createApplicationDto.monthlyIncome,
        },
      });

      const contactTypeMobile =
        (await tx.contact_types.findFirst({
          where: { contact_type_name: { equals: 'MOBILE', mode: 'insensitive' }, is_active: true },
          select: { contact_type_id: true },
        })) ??
        (await tx.contact_types.create({
          data: { contact_type_code: 'MOB', contact_type_name: 'MOBILE' },
          select: { contact_type_id: true },
        }));

      await tx.customer_contact_details.create({
        data: {
          customer_id: customer.customer_id,
          contact_type_id: contactTypeMobile.contact_type_id,
          contact_value: createApplicationDto.mobile,
          is_primary: true,
        },
      });

      const contactTypeEmail =
        (await tx.contact_types.findFirst({
          where: { contact_type_name: { equals: 'EMAIL', mode: 'insensitive' }, is_active: true },
          select: { contact_type_id: true },
        })) ??
        (await tx.contact_types.create({
          data: { contact_type_code: 'EMAIL', contact_type_name: 'EMAIL' },
          select: { contact_type_id: true },
        }));

      await tx.customer_contact_details.create({
        data: {
          customer_id: customer.customer_id,
          contact_type_id: contactTypeEmail.contact_type_id,
          contact_value: createApplicationDto.email,
          is_primary: false,
        },
      });

      const docTypeGovId =
        (await tx.document_types.findFirst({
          where: {
            document_type_name: { equals: 'GOVERNMENT_ID', mode: 'insensitive' },
            is_active: true,
          },
          select: { document_type_id: true },
        })) ??
        (await tx.document_types.create({
          data: { document_type_code: 'GOV_ID', document_type_name: 'GOVERNMENT_ID' },
          select: { document_type_id: true },
        }));

      await tx.customer_document_details.create({
        data: {
          customer_id: customer.customer_id,
          document_type_id: docTypeGovId.document_type_id,
          document_name: 'Government ID',
          document_path: createApplicationDto.uploadGovernmentId,
        },
      });

      const docTypePaySlip =
        (await tx.document_types.findFirst({
          where: {
            document_type_name: { equals: 'PAY_SLIP', mode: 'insensitive' },
            is_active: true,
          },
          select: { document_type_id: true },
        })) ??
        (await tx.document_types.create({
          data: { document_type_code: 'PAY_SLIP', document_type_name: 'PAY_SLIP' },
          select: { document_type_id: true },
        }));

      await tx.customer_document_details.create({
        data: {
          customer_id: customer.customer_id,
          document_type_id: docTypePaySlip.document_type_id,
          document_name: 'Pay Slip',
          document_path: createApplicationDto.uploadPaySlip,
        },
      });

      const docTypeBankStatement =
        (await tx.document_types.findFirst({
          where: {
            document_type_name: { equals: 'BANK_STATEMENT', mode: 'insensitive' },
            is_active: true,
          },
          select: { document_type_id: true },
        })) ??
        (await tx.document_types.create({
          data: { document_type_code: 'BANK_STATEMENT', document_type_name: 'BANK_STATEMENT' },
          select: { document_type_id: true },
        }));

      await tx.customer_document_details.create({
        data: {
          customer_id: customer.customer_id,
          document_type_id: docTypeBankStatement.document_type_id,
          document_name: 'Bank Statement',
          document_path: createApplicationDto.uploadBankStatement,
        },
      });

      const maskedGovId = createApplicationDto.governmentIdNumber
        .slice(-4)
        .padStart(createApplicationDto.governmentIdNumber.length, '*');
      const saltRounds = this.configService.get<number>('bcrypt.saltRounds', 10);
      const hashedGovId = await bcrypt.hash(createApplicationDto.governmentIdNumber, saltRounds);
      const encryptedGovId = Buffer.from(hashedGovId);

      await tx.customer_government_id.create({
        data: {
          customer_id: customer.customer_id,
          government_id_type_id: governmentIdType.government_id_type_id,
          government_id_number_masked: maskedGovId,
          government_id_number_encrypted: encryptedGovId,
        },
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
        application_id: loanApplication.application_id,
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
