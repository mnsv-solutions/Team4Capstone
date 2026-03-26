import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import * as bcrypt from 'bcrypt';

import { Prisma } from '../../generated/prisma/client.js';
import { JwtPayload } from '../common/types/jwtpayload.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateApplicationRequestDto } from './dto/createApplicationRequest.dto.js';
import { CreateApplicationResponseDto } from './dto/createApplicationResponse.dto.js';

type PrismaTransaction = Parameters<Parameters<PrismaService['$transaction']>[0]>[0];

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
    try {
      return await this.prisma.$transaction(async (tx) => {
        const userId = currentUser.sub;

        const references = await this.resolveReferenceData(tx, createApplicationDto);

        const customerId = await this.createCustomerRecord(
          tx,
          createApplicationDto,
          userId,
          references,
        );

        await Promise.all([
          this.createAddressDetails(tx, customerId, createApplicationDto, references),
          this.createEducationAndEmployment(tx, customerId, createApplicationDto, references),
          this.createFinancialDetails(tx, customerId, createApplicationDto),
          this.createContactDetails(tx, customerId, createApplicationDto),
          this.createBankDetails(tx, customerId, createApplicationDto),
          this.saveCustomerDocuments(tx, customerId, createApplicationDto),
          this.createGovernmentIdDetails(tx, customerId, createApplicationDto, references),
        ]);

        const application = await this.createLoanApplication(
          tx,
          customerId,
          userId,
          references.statusId,
        );

        return {
          application_id: application.application_id,
          application_number: application.application_number,
          message: 'Application created successfully.',
        };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.target as Array<string> | string | undefined;
          let fields = 'unique fields';
          if (Array.isArray(target)) {
            fields = target.join(', ');
          } else if (typeof target === 'string') {
            fields = target;
          }
          throw new BadRequestException(
            `Application creation failed: Duplicate values found for ${fields}. Please ensure your contact details or identifier are unique.`,
          );
        }
      }
      throw error;
    }
  }

  private async resolveReferenceData(tx: PrismaTransaction, dto: CreateApplicationRequestDto) {
    const status =
      (await tx.application_status.findFirst({
        where: { is_active: true, status_code: { in: ['SUBMITTED', 'PENDING', 'NEW'] } },
        select: { status_id: true },
        orderBy: { created_at: 'asc' },
      })) ??
      (await tx.application_status.create({
        data: { status_code: 'SUBMITTED', status_name: 'Submitted' },
        select: { status_id: true },
      }));

    const homeAddressType =
      (await tx.address_types.findFirst({
        where: { is_active: true, address_type_code: { in: ['HOME', 'RESIDENTIAL', 'CURRENT'] } },
        select: { address_type_id: true },
        orderBy: { created_at: 'asc' },
      })) ??
      (await tx.address_types.create({
        data: { address_type_code: 'HOME', address_type_name: 'Home Address' },
        select: { address_type_id: true },
      }));

    const mailingAddressType =
      (await tx.address_types.findFirst({
        where: { is_active: true, address_type_code: { in: ['MAILING', 'POSTAL'] } },
        select: { address_type_id: true },
        orderBy: { created_at: 'asc' },
      })) ??
      (await tx.address_types.create({
        data: { address_type_code: 'MAILING', address_type_name: 'Mailing Address' },
        select: { address_type_id: true },
      }));

    const educationLevel =
      (await tx.education_levels.findFirst({
        where: {
          is_active: true,
          level_name: { equals: dto.highestEducation, mode: 'insensitive' },
        },
        select: { education_level_id: true },
      })) ??
      (await tx.education_levels.create({
        data: {
          level_code: this.generateReferenceCode('EDU', dto.highestEducation),
          level_name: dto.highestEducation,
        },
        select: { education_level_id: true },
      }));

    const institution =
      (await tx.institutions.findFirst({
        where: {
          is_active: true,
          institution_name: { equals: dto.institutionName, mode: 'insensitive' },
        },
        select: { institution_id: true },
      })) ??
      (await tx.institutions.create({
        data: { institution_name: dto.institutionName },
        select: { institution_id: true },
      }));

    const employmentType =
      (await tx.employment_types.findFirst({
        where: {
          is_active: true,
          employment_type_name: { equals: dto.employmentStatus, mode: 'insensitive' },
        },
        select: { employment_type_id: true },
      })) ??
      (await tx.employment_types.create({
        data: {
          employment_type_code: this.generateReferenceCode('EMP', dto.employmentStatus),
          employment_type_name: dto.employmentStatus,
        },
        select: { employment_type_id: true },
      }));

    const gender =
      (await tx.genders.findFirst({
        where: { is_active: true, gender_name: { equals: dto.gender, mode: 'insensitive' } },
        select: { gender_id: true },
      })) ??
      (await tx.genders.create({
        data: {
          gender_code: this.generateReferenceCode('GEN', dto.gender),
          gender_name: dto.gender,
        },
        select: { gender_id: true },
      }));

    const maritalStatus =
      (await tx.marital_statuses.findFirst({
        where: {
          is_active: true,
          marital_status_name: { equals: dto.maritalStatus, mode: 'insensitive' },
        },
        select: { marital_status_id: true },
      })) ??
      (await tx.marital_statuses.create({
        data: {
          marital_status_code: this.generateReferenceCode('MAR', dto.maritalStatus),
          marital_status_name: dto.maritalStatus,
        },
        select: { marital_status_id: true },
      }));

    const nationalityCountry =
      (await tx.countries.findFirst({
        where: {
          is_active: true,
          nationality_name: { equals: dto.nationality, mode: 'insensitive' },
        },
        select: { country_id: true },
      })) ??
      (await tx.countries.findFirst({
        where: { is_active: true, country_name: { equals: dto.nationality, mode: 'insensitive' } },
        select: { country_id: true },
      })) ??
      (await tx.countries.create({
        data: {
          country_code: dto.nationality.substring(0, 3).toUpperCase(),
          country_name: dto.nationality,
          nationality_name: dto.nationality,
        },
        select: { country_id: true },
      }));

    const governmentIdType =
      (await tx.government_id_types.findFirst({
        where: {
          is_active: true,
          government_id_type_name: { equals: dto.governmentIdType, mode: 'insensitive' },
        },
        select: { government_id_type_id: true },
      })) ??
      (await tx.government_id_types.create({
        data: {
          government_id_type_code: this.generateReferenceCode('GOV_ID', dto.governmentIdType),
          government_id_type_name: dto.governmentIdType,
        },
        select: { government_id_type_id: true },
      }));

    return {
      statusId: status.status_id,
      homeAddressTypeId: homeAddressType.address_type_id,
      mailingAddressTypeId: mailingAddressType.address_type_id,
      educationLevelId: educationLevel.education_level_id,
      institutionId: institution.institution_id,
      employmentTypeId: employmentType.employment_type_id,
      genderId: gender.gender_id,
      maritalStatusId: maritalStatus.marital_status_id,
      nationalityCountryId: nationalityCountry.country_id,
      governmentIdTypeId: governmentIdType.government_id_type_id,
    };
  }

  private async createCustomerRecord(
    tx: PrismaTransaction,
    dto: CreateApplicationRequestDto,
    userId: string,
    references: any,
  ) {
    const saltRounds = this.configService.get<number>('bcrypt.saltRounds', 10);
    let maskedSinTaxId = null;
    let encryptedSinTaxId = null;

    if (dto.sinTaxId && dto.sinTaxId.trim() !== '') {
      maskedSinTaxId = dto.sinTaxId.slice(-4).padStart(dto.sinTaxId.length, '*');
      const hashedSin = await bcrypt.hash(dto.sinTaxId, saltRounds);
      encryptedSinTaxId = Buffer.from(hashedSin);
    }

    const customer = await tx.customer.create({
      data: {
        first_name: dto.firstName,
        last_name: dto.lastName,
        date_of_birth: new Date(dto.dob),
        gender_id: references.genderId,
        marital_status_id: references.maritalStatusId,
        nationality_country_id: references.nationalityCountryId,
        sin_tax_id_masked: maskedSinTaxId,
        sin_tax_id_encrypted: encryptedSinTaxId,
        created_by: userId,
      },
      select: { customer_id: true },
    });

    return customer.customer_id;
  }

  private async createAddressDetails(
    tx: PrismaTransaction,
    customerId: string,
    dto: CreateApplicationRequestDto,
    references: any,
  ) {
    const resCountry =
      (await tx.countries.findFirst({
        where: {
          is_active: true,
          country_name: { equals: dto.residentialAddress.country, mode: 'insensitive' },
        },
        select: { country_id: true },
      })) ??
      (await tx.countries.create({
        data: {
          country_code: dto.residentialAddress.country.substring(0, 3).toUpperCase(),
          country_name: dto.residentialAddress.country,
          nationality_name: `${dto.residentialAddress.country} National`,
        },
        select: { country_id: true },
      }));

    await tx.customer_address_details.create({
      data: {
        customer_id: customerId,
        address_type_id: references.homeAddressTypeId,
        line1: dto.residentialAddress.line1,
        line2: dto.residentialAddress.line2,
        city: dto.residentialAddress.city,
        state_province: dto.residentialAddress.state,
        postal_code: dto.residentialAddress.postalCode,
        country_id: resCountry.country_id,
        is_primary: true,
      },
    });

    if (!dto.mailingSameAsResidential && dto.mailingAddress) {
      const mailCountry =
        (await tx.countries.findFirst({
          where: {
            is_active: true,
            country_name: { equals: dto.mailingAddress.country, mode: 'insensitive' },
          },
          select: { country_id: true },
        })) ??
        (await tx.countries.create({
          data: {
            country_code: dto.mailingAddress.country.substring(0, 3).toUpperCase(),
            country_name: dto.mailingAddress.country,
            nationality_name: `${dto.mailingAddress.country} National`,
          },
          select: { country_id: true },
        }));

      await tx.customer_address_details.create({
        data: {
          customer_id: customerId,
          address_type_id: references.mailingAddressTypeId,
          line1: dto.mailingAddress.line1,
          line2: dto.mailingAddress.line2,
          city: dto.mailingAddress.city,
          state_province: dto.mailingAddress.state,
          postal_code: dto.mailingAddress.postalCode,
          country_id: mailCountry.country_id,
          is_primary: false,
        },
      });
    }
  }

  private async createEducationAndEmployment(
    tx: PrismaTransaction,
    customerId: string,
    dto: CreateApplicationRequestDto,
    references: any,
  ) {
    await tx.customer_education_details.create({
      data: {
        customer_id: customerId,
        education_level_id: references.educationLevelId,
        institution_id: references.institutionId,
        field_of_study: dto.fieldOfStudy,
        graduation_year:
          dto.graduationYear && String(dto.graduationYear).trim() !== ''
            ? Number(dto.graduationYear)
            : null,
      },
    });

    await tx.customer_employment_details.create({
      data: {
        customer_id: customerId,
        employment_type_id: references.employmentTypeId,
        employer_name: dto.employerName,
        job_title: dto.jobTitle,
        work_experience_years:
          dto.workExperience && String(dto.workExperience).trim() !== ''
            ? Number(dto.workExperience)
            : null,
        monthly_income:
          dto.monthlyIncome && String(dto.monthlyIncome).trim() !== ''
            ? Number(dto.monthlyIncome)
            : null,
      },
    });
  }

  private async createFinancialDetails(
    tx: PrismaTransaction,
    customerId: string,
    dto: CreateApplicationRequestDto,
  ) {
    if (
      dto.otherIncomeSources &&
      String(dto.otherIncomeSources).trim() !== '' &&
      Number(dto.otherIncomeSources) > 0
    ) {
      const incomeType =
        (await tx.income_source_types.findFirst({
          where: {
            is_active: true,
            income_source_type_name: { equals: 'OTHER', mode: 'insensitive' },
          },
          select: { income_source_type_id: true },
        })) ??
        (await tx.income_source_types.create({
          data: { income_source_type_code: 'OTHER', income_source_type_name: 'OTHER' },
          select: { income_source_type_id: true },
        }));

      await tx.customer_income_sources.create({
        data: {
          customer_id: customerId,
          income_source_type_id: incomeType.income_source_type_id,
          monthly_amount: Number(dto.otherIncomeSources),
          description: 'Other Income Sources',
        },
      });
    }

    if (
      dto.totalMonthlyLoanPayments &&
      String(dto.totalMonthlyLoanPayments).trim() !== '' &&
      Number(dto.totalMonthlyLoanPayments) > 0
    ) {
      const liabilityType =
        (await tx.liability_types.findFirst({
          where: {
            is_active: true,
            liability_type_name: { equals: 'EXISTING_LOAN', mode: 'insensitive' },
          },
          select: { liability_type_id: true },
        })) ??
        (await tx.liability_types.create({
          data: { liability_type_code: 'LOAN', liability_type_name: 'EXISTING_LOAN' },
          select: { liability_type_id: true },
        }));

      await tx.customer_liabilities.create({
        data: {
          customer_id: customerId,
          liability_type_id: liabilityType.liability_type_id,
          monthly_payment: Number(dto.totalMonthlyLoanPayments),
        },
      });
    }
  }

  private async createContactDetails(
    tx: PrismaTransaction,
    customerId: string,
    dto: CreateApplicationRequestDto,
  ) {
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
        customer_id: customerId,
        contact_type_id: contactTypeMobile.contact_type_id,
        contact_value: dto.mobile,
        is_primary: true,
      },
    });

    if (dto.alternatePhone && dto.alternatePhone.trim() !== '') {
      await tx.customer_contact_details.create({
        data: {
          customer_id: customerId,
          contact_type_id: contactTypeMobile.contact_type_id, // Same fallback as original
          contact_value: dto.alternatePhone,
          is_primary: false,
        },
      });
    }

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
        customer_id: customerId,
        contact_type_id: contactTypeEmail.contact_type_id,
        contact_value: dto.email,
        is_primary: false,
      },
    });
  }

  private async createBankDetails(
    tx: PrismaTransaction,
    customerId: string,
    dto: CreateApplicationRequestDto,
  ) {
    if (dto.bankAccounts && dto.bankAccounts.length > 0) {
      const saltRounds = this.configService.get<number>('bcrypt.saltRounds', 10);

      for (const acc of dto.bankAccounts) {
        const bank =
          (await tx.banks.findFirst({
            where: { is_active: true, bank_name: { equals: acc.bankName, mode: 'insensitive' } },
            select: { bank_id: true },
          })) ??
          (await tx.banks.create({
            data: {
              bank_code: this.generateReferenceCode('BNK', acc.bankName),
              bank_name: acc.bankName,
            },
            select: { bank_id: true },
          }));

        const actType =
          (await tx.bank_account_types.findFirst({
            where: {
              is_active: true,
              account_type_name: { equals: acc.accountType, mode: 'insensitive' },
            },
            select: { bank_account_type_id: true },
          })) ??
          (await tx.bank_account_types.create({
            data: {
              account_type_code: this.generateReferenceCode('ACT', acc.accountType),
              account_type_name: acc.accountType,
            },
            select: { bank_account_type_id: true },
          }));

        const maskedAcc = acc.accountNumber.slice(-4).padStart(acc.accountNumber.length, '*');
        const hashedAcc = await bcrypt.hash(acc.accountNumber, saltRounds);

        await tx.customer_bank_details.create({
          data: {
            customer_id: customerId,
            bank_id: bank.bank_id,
            bank_account_type_id: actType.bank_account_type_id,
            account_number_masked: maskedAcc,
            account_number_encrypted: Buffer.from(hashedAcc),
            is_primary: acc.isRepaymentAccount ?? false,
          },
        });
      }
    }
  }

  private async handleDocument(
    tx: PrismaTransaction,
    customerId: string,
    docObj: any,
    docTypeName: string,
  ) {
    if (!docObj || String(docObj).trim() === '') return;
    const docPath = String(docObj);

    const dt =
      (await tx.document_types.findFirst({
        where: {
          document_type_name: { equals: docTypeName, mode: 'insensitive' },
          is_active: true,
        },
        select: { document_type_id: true },
      })) ??
      (await tx.document_types.create({
        data: {
          document_type_code: this.generateReferenceCode('DOC', docTypeName),
          document_type_name: docTypeName,
        },
        select: { document_type_id: true },
      }));

    await tx.customer_document_details.create({
      data: {
        customer_id: customerId,
        document_type_id: dt.document_type_id,
        document_name: docTypeName,
        document_path: docPath,
      },
    });
  }

  private async saveCustomerDocuments(
    tx: PrismaTransaction,
    customerId: string,
    dto: CreateApplicationRequestDto,
  ) {
    await this.handleDocument(tx, customerId, dto.governmentIdProof, 'Government ID');
    await this.handleDocument(tx, customerId, dto.incomeProof, 'Pay Slip / Income Proof');
    await this.handleDocument(tx, customerId, dto.bankStatement, 'Bank Statement');
  }

  private async createGovernmentIdDetails(
    tx: PrismaTransaction,
    customerId: string,
    dto: CreateApplicationRequestDto,
    references: any,
  ) {
    const saltRounds = this.configService.get<number>('bcrypt.saltRounds', 10);
    const maskedGovId = dto.governmentIdNumber
      .slice(-4)
      .padStart(dto.governmentIdNumber.length, '*');
    const hashedGovId = await bcrypt.hash(dto.governmentIdNumber, saltRounds);
    const encryptedGovId = Buffer.from(hashedGovId);

    await tx.customer_government_id.create({
      data: {
        customer_id: customerId,
        government_id_type_id: references.governmentIdTypeId,
        government_id_number_masked: maskedGovId,
        government_id_number_encrypted: encryptedGovId,
      },
    });
  }

  private async createLoanApplication(
    tx: PrismaTransaction,
    customerId: string,
    userId: string,
    statusId: string,
  ) {
    const applicationNumber = await this.generateUniqueApplicationNumber(tx);

    const loanApplication = await tx.loan_application.create({
      data: {
        application_number: applicationNumber,
        status_id: statusId,
        created_by: userId,
      },
      select: { application_id: true },
    });

    await tx.sub_loan.create({
      data: {
        application_id: loanApplication.application_id,
        customer_id: customerId,
        applicant_type: 0,
        created_by: userId,
      },
    });

    return {
      application_id: loanApplication.application_id,
      application_number: applicationNumber,
    };
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

  private async generateUniqueApplicationNumber(tx: PrismaTransaction): Promise<string> {
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
