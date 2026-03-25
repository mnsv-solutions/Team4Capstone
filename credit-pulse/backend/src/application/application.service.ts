import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';

import { JwtPayload } from '../common/types/jwtpayload.js';
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

      const homeAddressType =
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

      const mailingAddressType =
        (await tx.address_types.findFirst({
          where: {
            is_active: true,
            address_type_code: {
              in: ['MAILING', 'POSTAL'],
            },
          },
          select: { address_type_id: true },
          orderBy: { created_at: 'asc' },
        })) ??
        (await tx.address_types.create({
          data: {
            address_type_code: 'MAILING',
            address_type_name: 'Mailing Address',
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
              equals: createApplicationDto.institutionName,
              mode: 'insensitive',
            },
          },
          select: { institution_id: true },
        })) ??
        (await tx.institutions.create({
          data: {
            institution_name: createApplicationDto.institutionName,
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

      const nationalityCountry =
        (await tx.countries.findFirst({
          where: {
            is_active: true,
            nationality_name: {
              equals: createApplicationDto.nationality,
              mode: 'insensitive',
            },
          },
          select: { country_id: true },
        })) ??
        (await tx.countries.findFirst({
          where: {
            is_active: true,
            country_name: {
              equals: createApplicationDto.nationality,
              mode: 'insensitive',
            },
          },
          select: { country_id: true },
        })) ??
        (await tx.countries.create({
          data: {
            country_code: createApplicationDto.nationality.substring(0, 3).toUpperCase(),
            country_name: createApplicationDto.nationality,
            nationality_name: createApplicationDto.nationality,
          },
          select: { country_id: true },
        }));

      const governmentIdType =
        (await tx.government_id_types.findFirst({
          where: {
            is_active: true,
            government_id_type_name: {
              equals: createApplicationDto.governmentIdType,
              mode: 'insensitive',
            },
          },
          select: { government_id_type_id: true },
        })) ??
        (await tx.government_id_types.create({
          data: {
            government_id_type_code: this.generateReferenceCode(
              'GOV_ID',
              createApplicationDto.governmentIdType,
            ),
            government_id_type_name: createApplicationDto.governmentIdType,
          },
          select: { government_id_type_id: true },
        }));

      const saltRounds = this.configService.get<number>('bcrypt.saltRounds', 10);
      let maskedSinTaxId = null;
      let encryptedSinTaxId = null;
      if (createApplicationDto.sinTaxId && createApplicationDto.sinTaxId.trim() !== '') {
        maskedSinTaxId = createApplicationDto.sinTaxId
          .slice(-4)
          .padStart(createApplicationDto.sinTaxId.length, '*');
        const hashedSin = await bcrypt.hash(createApplicationDto.sinTaxId, saltRounds);
        encryptedSinTaxId = Buffer.from(hashedSin);
      }

      const customer = await tx.customer.create({
        data: {
          first_name: createApplicationDto.firstName,
          last_name: createApplicationDto.lastName,
          date_of_birth: new Date(createApplicationDto.dob),
          gender_id: gender.gender_id,
          marital_status_id: maritalStatus.marital_status_id,
          nationality_country_id: nationalityCountry.country_id,
          sin_tax_id_masked: maskedSinTaxId,
          sin_tax_id_encrypted: encryptedSinTaxId,
          created_by: userId,
        },
        select: { customer_id: true },
      });

      const resCountry =
        (await tx.countries.findFirst({
          where: {
            is_active: true,
            country_name: {
              equals: createApplicationDto.residentialAddress.country,
              mode: 'insensitive',
            },
          },
          select: { country_id: true },
        })) ??
        (await tx.countries.create({
          data: {
            country_code: createApplicationDto.residentialAddress.country
              .substring(0, 3)
              .toUpperCase(),
            country_name: createApplicationDto.residentialAddress.country,
            nationality_name: `${createApplicationDto.residentialAddress.country} National`,
          },
          select: { country_id: true },
        }));

      await tx.customer_address_details.create({
        data: {
          customer_id: customer.customer_id,
          address_type_id: homeAddressType.address_type_id,
          line1: createApplicationDto.residentialAddress.line1,
          line2: createApplicationDto.residentialAddress.line2,
          city: createApplicationDto.residentialAddress.city,
          state_province: createApplicationDto.residentialAddress.state,
          postal_code: createApplicationDto.residentialAddress.postalCode,
          country_id: resCountry.country_id,
          is_primary: true,
        },
      });

      if (!createApplicationDto.mailingSameAsResidential && createApplicationDto.mailingAddress) {
        const mailCountry =
          (await tx.countries.findFirst({
            where: {
              is_active: true,
              country_name: {
                equals: createApplicationDto.mailingAddress.country,
                mode: 'insensitive',
              },
            },
            select: { country_id: true },
          })) ??
          (await tx.countries.create({
            data: {
              country_code: createApplicationDto.mailingAddress.country
                .substring(0, 3)
                .toUpperCase(),
              country_name: createApplicationDto.mailingAddress.country,
              nationality_name: `${createApplicationDto.mailingAddress.country} National`,
            },
            select: { country_id: true },
          }));

        await tx.customer_address_details.create({
          data: {
            customer_id: customer.customer_id,
            address_type_id: mailingAddressType.address_type_id,
            line1: createApplicationDto.mailingAddress.line1,
            line2: createApplicationDto.mailingAddress.line2,
            city: createApplicationDto.mailingAddress.city,
            state_province: createApplicationDto.mailingAddress.state,
            postal_code: createApplicationDto.mailingAddress.postalCode,
            country_id: mailCountry.country_id,
            is_primary: false,
          },
        });
      }

      await tx.customer_education_details.create({
        data: {
          customer_id: customer.customer_id,
          education_level_id: educationLevel.education_level_id,
          institution_id: institution.institution_id,
          field_of_study: createApplicationDto.fieldOfStudy,
          graduation_year:
            createApplicationDto.graduationYear &&
            String(createApplicationDto.graduationYear).trim() !== ''
              ? Number(createApplicationDto.graduationYear)
              : null,
        },
      });

      await tx.customer_employment_details.create({
        data: {
          customer_id: customer.customer_id,
          employment_type_id: employmentType.employment_type_id,
          employer_name: createApplicationDto.employerName,
          job_title: createApplicationDto.jobTitle,
          work_experience_years:
            createApplicationDto.workExperience &&
            String(createApplicationDto.workExperience).trim() !== ''
              ? Number(createApplicationDto.workExperience)
              : null,
          monthly_income:
            createApplicationDto.monthlyIncome &&
            String(createApplicationDto.monthlyIncome).trim() !== ''
              ? Number(createApplicationDto.monthlyIncome)
              : null,
        },
      });

      if (
        createApplicationDto.otherIncomeSources &&
        String(createApplicationDto.otherIncomeSources).trim() !== '' &&
        Number(createApplicationDto.otherIncomeSources) > 0
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
            customer_id: customer.customer_id,
            income_source_type_id: incomeType.income_source_type_id,
            monthly_amount: Number(createApplicationDto.otherIncomeSources),
            description: 'Other Income Sources',
          },
        });
      }

      if (
        createApplicationDto.totalMonthlyLoanPayments &&
        String(createApplicationDto.totalMonthlyLoanPayments).trim() !== '' &&
        Number(createApplicationDto.totalMonthlyLoanPayments) > 0
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
            customer_id: customer.customer_id,
            liability_type_id: liabilityType.liability_type_id,
            monthly_payment: Number(createApplicationDto.totalMonthlyLoanPayments),
          },
        });
      }

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

      if (
        createApplicationDto.alternatePhone &&
        createApplicationDto.alternatePhone.trim() !== ''
      ) {
        await tx.customer_contact_details.create({
          data: {
            customer_id: customer.customer_id,
            contact_type_id: contactTypeMobile.contact_type_id,
            contact_value: createApplicationDto.alternatePhone,
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
          customer_id: customer.customer_id,
          contact_type_id: contactTypeEmail.contact_type_id,
          contact_value: createApplicationDto.email,
          is_primary: false,
        },
      });

      if (createApplicationDto.bankAccounts && createApplicationDto.bankAccounts.length > 0) {
        for (const acc of createApplicationDto.bankAccounts) {
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
              customer_id: customer.customer_id,
              bank_id: bank.bank_id,
              bank_account_type_id: actType.bank_account_type_id,
              account_number_masked: maskedAcc,
              account_number_encrypted: Buffer.from(hashedAcc),
              is_primary: acc.isRepaymentAccount ?? false,
            },
          });
        }
      }

      const handleDoc = async (docObj: any, docTypeName: string) => {
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
            customer_id: customer.customer_id,
            document_type_id: dt.document_type_id,
            document_name: docTypeName,
            document_path: docPath,
          },
        });
      };

      await handleDoc(createApplicationDto.governmentIdProof, 'Government ID');
      await handleDoc(createApplicationDto.incomeProof, 'Pay Slip / Income Proof');
      await handleDoc(createApplicationDto.bankStatement, 'Bank Statement');

      const maskedGovId = createApplicationDto.governmentIdNumber
        .slice(-4)
        .padStart(createApplicationDto.governmentIdNumber.length, '*');
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
