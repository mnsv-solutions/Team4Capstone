import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import * as bcrypt from 'bcrypt';

import { Prisma } from '../../generated/prisma/client.js';
import { AwsService } from '../aws/aws.service.js';
import { JwtPayload } from '../common/types/jwtpayload.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateApplicationRequestDto } from './dto/createApplicationRequest.dto.js';
import { CreateApplicationResponseDto } from './dto/createApplicationResponse.dto.js';
import { GetContactDetailsRequestDto } from './dto/getContactDetailsRequest.dto.js';
import { GetContactDetailsResponseDto } from './dto/getContactDetailsResponse.dto.js';
import { GetDocumentDetailsRequestDto } from './dto/getDocumentDetailsRequest.dto.js';
import { GetDocumentDetailsResponseDto } from './dto/getDocumentDetailsResponse.dto.js';
import { GetEducationDetailsRequestDto } from './dto/getEducationDetailsRequest.dto.js';
import { GetEducationDetailsResponseDto } from './dto/getEducationDetailsResponse.dto.js';
import { GetFinancialDetailsRequestDto } from './dto/getFinancialDetailsRequest.dto.js';
import { GetFinancialDetailsResponseDto } from './dto/getFinancialDetailsResponse.dto.js';
import { GetPersonalInformationRequestDto } from './dto/getPersonalInformationRequest.dto.js';
import { GetPersonalInformationResponseDto } from './dto/getPersonalInformationResponse.dto.js';

type PrismaTransaction = Parameters<Parameters<PrismaService['$transaction']>[0]>[0];

@Injectable()
export class ApplicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly awsService: AwsService,
  ) {}

  async uploadFiles(
    applicationId: string,
    files: {
      governmentIdProof?: any[];
      incomeProof?: any[];
      bankStatement?: any[];
    },
  ) {
    const bucket = this.configService.get<string>('aws.s3.bucketName') || 'credit-pulse-bucket';
    const projectId = applicationId;

    const uploadedPaths: any = {};

    if (files?.governmentIdProof && files.governmentIdProof.length > 0) {
      const file = files.governmentIdProof[0];
      const key = `${projectId}/government/${Date.now()}-${file.originalname}`;
      const url = await this.awsService.uploadToS3(bucket, key, file.buffer);
      uploadedPaths.governmentIdProof = url;
    }

    if (files?.incomeProof && files.incomeProof.length > 0) {
      const file = files.incomeProof[0];
      const key = `${projectId}/income/${Date.now()}-${file.originalname}`;
      const url = await this.awsService.uploadToS3(bucket, key, file.buffer);
      uploadedPaths.incomeProof = url;
    }

    if (files?.bankStatement && files.bankStatement.length > 0) {
      const file = files.bankStatement[0];
      const key = `${projectId}/bankstatement/${Date.now()}-${file.originalname}`;
      const url = await this.awsService.uploadToS3(bucket, key, file.buffer);
      uploadedPaths.bankStatement = url;
    }

    const subLoan = await this.prisma.sub_loan.findFirst({
      where: { application_id: applicationId },
    });

    if (!subLoan) {
      throw new BadRequestException('Application with that ID could not be found.');
    }

    await this.prisma.$transaction(async (tx) => {
      await this.saveCustomerDocuments(tx, subLoan.customer_id, {
        governmentIdProof: uploadedPaths.governmentIdProof,
        incomeProof: uploadedPaths.incomeProof,
        bankStatement: uploadedPaths.bankStatement,
      } as any);
    });

    return uploadedPaths;
  }

  async createApplication(
    createApplicationDto: CreateApplicationRequestDto,
    currentUser: JwtPayload,
  ): Promise<CreateApplicationResponseDto> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        if (
          !createApplicationDto.creditReportConsent ||
          !createApplicationDto.declarationAccepted
        ) {
          throw new BadRequestException(
            'Credit Report Consent and Declaration Accepted are required.',
          );
        }

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
          let fields = error.meta ? JSON.stringify(error.meta) : 'unique fields';
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

    const nationalityCountryId = await this.getOrCreateCountry(
      tx,
      dto.nationality,
      dto.nationality,
    );

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
      nationalityCountryId,
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
    const resCountryId = await this.getOrCreateCountry(tx, dto.residentialAddress.country);

    await tx.customer_address_details.create({
      data: {
        customer_id: customerId,
        address_type_id: references.homeAddressTypeId,
        line1: dto.residentialAddress.line1,
        line2: dto.residentialAddress.line2,
        city: dto.residentialAddress.city,
        state_province: dto.residentialAddress.state,
        postal_code: dto.residentialAddress.postalCode,
        country_id: resCountryId,
        is_primary: true,
      },
    });

    if (!dto.mailingSameAsResidential && dto.mailingAddress) {
      const mailCountryId = await this.getOrCreateCountry(tx, dto.mailingAddress.country);

      await tx.customer_address_details.create({
        data: {
          customer_id: customerId,
          address_type_id: references.mailingAddressTypeId,
          line1: dto.mailingAddress.line1,
          line2: dto.mailingAddress.line2,
          city: dto.mailingAddress.city,
          state_province: dto.mailingAddress.state,
          postal_code: dto.mailingAddress.postalCode,
          country_id: mailCountryId,
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
        where: { contact_type_code: { equals: 'MOBILE', mode: 'insensitive' }, is_active: true },
        select: { contact_type_id: true },
      })) ??
      (await tx.contact_types.create({
        data: { contact_type_code: 'MOBILE', contact_type_name: 'Mobile Number' },
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
        where: { contact_type_code: { equals: 'EMAIL', mode: 'insensitive' }, is_active: true },
        select: { contact_type_id: true },
      })) ??
      (await tx.contact_types.create({
        data: { contact_type_code: 'EMAIL', contact_type_name: 'Email Address' },
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

  private async getOrCreateCountry(
    tx: PrismaTransaction,
    countryName: string,
    nationalityName?: string,
  ): Promise<string> {
    const defaultCode = countryName.substring(0, 3).toUpperCase().padEnd(3, 'X');
    let country = await tx.countries.findFirst({
      where: {
        is_active: true,
        OR: [
          { country_name: { equals: countryName, mode: 'insensitive' } },
          ...(nationalityName
            ? [{ nationality_name: { equals: nationalityName, mode: 'insensitive' as const } }]
            : []),
          { country_code: { equals: defaultCode } },
        ],
      },
      select: { country_id: true },
    });

    if (country) {
      return country.country_id;
    }

    let uniqueCode = defaultCode;
    let counter = 1;
    while (
      await tx.countries.findFirst({
        where: { country_code: uniqueCode },
        select: { country_id: true },
      })
    ) {
      const suffix = String(counter);
      uniqueCode = defaultCode.substring(0, 3 - suffix.length) + suffix;
      counter++;
    }

    const newCountry = await tx.countries.create({
      data: {
        country_code: uniqueCode,
        country_name: countryName,
        nationality_name: nationalityName || `${countryName} National`,
      },
      select: { country_id: true },
    });

    return newCountry.country_id;
  }

  async getPersonalInformation(
    dto: GetPersonalInformationRequestDto,
  ): Promise<GetPersonalInformationResponseDto> {
    const loanApp = await this.prisma.loan_application.findUnique({
      where: { application_number: dto.applicationNumber },
      include: {
        sub_loan: {
          include: {
            customer: {
              include: {
                gender: true,
                marital_status: true,
                nationality: true,
                government_ids: {
                  include: {
                    id_type: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!loanApp) {
      throw new NotFoundException(`Application with number ${dto.applicationNumber} not found.`);
    }

    const primarySubLoan =
      loanApp.sub_loan.find((sl) => sl.applicant_type === 0) || loanApp.sub_loan[0];
    if (!primarySubLoan || !primarySubLoan.customer) {
      throw new NotFoundException(
        `Customer details not found for application ${dto.applicationNumber}.`,
      );
    }

    const customer = primarySubLoan.customer;
    const govIdRecord =
      customer.government_ids?.find((gid) => gid.is_primary) || customer.government_ids?.[0];

    return {
      firstName: customer.first_name,
      lastName: customer.last_name,
      dob: customer.date_of_birth ? customer.date_of_birth.toISOString().split('T')[0] : '',
      gender: customer.gender?.gender_name || '',
      maritalStatus: customer.marital_status?.marital_status_name || '',
      nationality: customer.nationality?.country_name || '',
      governmentIdType: govIdRecord?.id_type?.government_id_type_name || '',
      governmentIdNumber: govIdRecord?.government_id_number_masked || '',
      sinTaxId: customer.sin_tax_id_masked || '',
    };
  }

  async getContactDetails(dto: GetContactDetailsRequestDto): Promise<GetContactDetailsResponseDto> {
    const loanApp = await this.prisma.loan_application.findUnique({
      where: { application_number: dto.applicationNumber },
      include: {
        sub_loan: {
          include: {
            customer: {
              include: {
                contact_details: {
                  include: {
                    contact_type: true,
                  },
                },
                address_details: {
                  include: {
                    country: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!loanApp) {
      throw new NotFoundException(`Application with number ${dto.applicationNumber} not found.`);
    }

    const primarySubLoan =
      loanApp.sub_loan.find((sl) => sl.applicant_type === 0) || loanApp.sub_loan[0];
    if (!primarySubLoan || !primarySubLoan.customer) {
      throw new NotFoundException(
        `Customer details not found for application ${dto.applicationNumber}.`,
      );
    }

    const customer = primarySubLoan.customer;

    const emailDetail = customer.contact_details?.find(
      (c) =>
        c.contact_type?.contact_type_code === 'EMAIL' ||
        c.contact_type?.contact_type_code === 'EMAIL_ADDRESS',
    );
    const mobileDetail = customer.contact_details?.find(
      (c) => c.contact_type?.contact_type_code === 'MOBILE' && c.is_primary === true,
    );
    const alternatePhoneDetail = customer.contact_details?.find(
      (c) => c.contact_type?.contact_type_code === 'MOBILE' && c.is_primary === false,
    );

    const residentialAddressDetail = customer.address_details?.find((a) => a.is_primary === true);
    const mailingAddressDetail = customer.address_details?.find((a) => a.is_primary === false);

    const mapAddress = (addr: typeof residentialAddressDetail) => {
      if (!addr) {
        return {
          line1: '',
          line2: '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
        };
      }
      return {
        line1: addr.line1 || '',
        line2: addr.line2 || '',
        city: addr.city || '',
        state: addr.state_province || '',
        postalCode: addr.postal_code || '',
        country: addr.country?.country_name || '',
      };
    };

    const resAddressMapped = mapAddress(residentialAddressDetail);
    const mailAddressMapped = mailingAddressDetail
      ? mapAddress(mailingAddressDetail)
      : resAddressMapped;

    return {
      email: emailDetail?.contact_value || '',
      mobile: mobileDetail?.contact_value || '',
      alternatePhone: alternatePhoneDetail?.contact_value || '',
      residentialAddress: resAddressMapped,
      mailingSameAsResidential: !mailingAddressDetail,
      mailingAddress: mailAddressMapped,
    };
  }

  async getEducationDetails(
    dto: GetEducationDetailsRequestDto,
  ): Promise<GetEducationDetailsResponseDto> {
    const loanApp = await this.prisma.loan_application.findUnique({
      where: { application_number: dto.applicationNumber },
      include: {
        sub_loan: {
          include: {
            customer: {
              include: {
                education_details: {
                  include: {
                    education_level: true,
                    institution: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!loanApp) {
      throw new NotFoundException(`Application with number ${dto.applicationNumber} not found.`);
    }

    const primarySubLoan =
      loanApp.sub_loan.find((sl) => sl.applicant_type === 0) || loanApp.sub_loan[0];
    if (!primarySubLoan || !primarySubLoan.customer) {
      throw new NotFoundException(
        `Customer details not found for application ${dto.applicationNumber}.`,
      );
    }

    const customer = primarySubLoan.customer;

    const educationDetail =
      customer.education_details?.find((e) => e.is_active) || customer.education_details?.[0];

    return {
      highestEducation: educationDetail?.education_level?.level_name || '',
      fieldOfStudy: educationDetail?.field_of_study || '',
      institutionName: educationDetail?.institution?.institution_name || '',
      graduationYear: educationDetail?.graduation_year?.toString() || '',
    };
  }

  async getFinancialDetails(
    dto: GetFinancialDetailsRequestDto,
  ): Promise<GetFinancialDetailsResponseDto> {
    const loanApp = await this.prisma.loan_application.findUnique({
      where: { application_number: dto.applicationNumber },
      include: {
        sub_loan: {
          include: {
            customer: {
              include: {
                employment_details: {
                  include: {
                    employment_type: true,
                  },
                },
                income_sources: true,
                liabilities: true,
                bank_details: {
                  include: {
                    bank: true,
                    account_type: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!loanApp) {
      throw new NotFoundException(`Application with number ${dto.applicationNumber} not found.`);
    }

    const primarySubLoan =
      loanApp.sub_loan.find((sl) => sl.applicant_type === 0) || loanApp.sub_loan[0];
    if (!primarySubLoan || !primarySubLoan.customer) {
      throw new NotFoundException(
        `Customer details not found for application ${dto.applicationNumber}.`,
      );
    }

    const customer = primarySubLoan.customer;

    const employmentDetail = customer.employment_details;
    const otherIncomeSource = customer.income_sources?.find(
      (inc) => inc.description === 'Other Income Sources' || inc.is_active,
    );
    const liabilityDetail = customer.liabilities?.find((l) => l.is_active);

    const bankAccounts = (customer.bank_details || [])
      .filter((b) => b.is_active)
      .map((b) => ({
        bankName: b.bank?.bank_name || '',
        institutionNumber: '',
        transitNumber: '',
        accountNumber: b.account_number_masked || '',
        accountType: b.account_type?.account_type_name || '',
        swiftBic: '',
        isRepaymentAccount: b.is_primary,
      }));

    return {
      employmentStatus: employmentDetail?.employment_type?.employment_type_name || '',
      employerName: employmentDetail?.employer_name || '',
      jobTitle: employmentDetail?.job_title || '',
      workExperience: employmentDetail?.work_experience_years?.toString() || '',
      monthlyIncome: employmentDetail?.monthly_income?.toString() || '',
      otherIncomeSources: otherIncomeSource?.monthly_amount?.toString() || '',
      existingLoans: '',
      totalMonthlyLoanPayments: liabilityDetail?.monthly_payment?.toString() || '',
      bankAccounts,
    };
  }

  async getDocumentDetails(
    dto: GetDocumentDetailsRequestDto,
  ): Promise<GetDocumentDetailsResponseDto> {
    const loanApp = await this.prisma.loan_application.findUnique({
      where: { application_number: dto.applicationNumber },
      include: {
        sub_loan: {
          include: {
            customer: {
              include: {
                documents: true,
              },
            },
          },
        },
      },
    });

    if (!loanApp) {
      throw new NotFoundException(`Application with number ${dto.applicationNumber} not found.`);
    }

    const primarySubLoan =
      loanApp.sub_loan.find((sl) => sl.applicant_type === 0) || loanApp.sub_loan[0];
    if (!primarySubLoan || !primarySubLoan.customer) {
      throw new NotFoundException(
        `Customer details not found for application ${dto.applicationNumber}.`,
      );
    }

    const customer = primarySubLoan.customer;
    const docs = customer.documents || [];

    const getDocDetails = (name: string) => {
      const doc = docs.find((d) => d.document_name === name && d.is_active);
      if (!doc || !doc.document_path) return undefined;

      const path = doc.document_path;
      const parts = path.split('/');
      const lastPart = parts[parts.length - 1] || '';

      let file_name = lastPart;
      try {
        file_name = decodeURIComponent(lastPart);
      } catch (e) {
        // Fallback to un-decoded if error
      }

      const dashIndex = file_name.indexOf('-');
      if (dashIndex !== -1) {
        file_name = file_name.substring(dashIndex + 1);
      }

      return {
        file_name,
        path,
      };
    };

    return {
      governmentIdProofUrl: getDocDetails('Government ID'),
      incomeProofUrl: getDocDetails('Pay Slip / Income Proof'),
      bankStatementUrl: getDocDetails('Bank Statement'),
    };
  }
}
