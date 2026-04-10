import { PrismaPg } from '@prisma/adapter-pg';

import * as bcrypt from 'bcrypt';
import { Buffer } from 'node:buffer';
import process from 'node:process';

import configuration from '../config/configuration.js';
import { PrismaClient } from '../generated/prisma/client.js';

function getDatabaseUrl(): string {
  const appConfig = configuration();
  const postgresConfig = appConfig?.db?.postgres;

  const host = postgresConfig?.host;
  const port = postgresConfig?.port ?? 5432;
  const user = postgresConfig?.username ?? postgresConfig?.user;
  const password = postgresConfig?.password;
  const database = postgresConfig?.database;
  const schema = postgresConfig?.schema ?? 'public';

  if (!host || !port || !user || !password || !database || !schema) {
    throw new Error('Missing database configuration in config.<env>.yaml');
  }

  const sslEnabled = postgresConfig?.ssl ?? false;
  if (sslEnabled) {
    const certPath = './global-bundle.pem';
    return `postgresql://${user}:${password}@${host}:${port}/${database}?schema=${schema}&sslmode=verify-full&sslrootcert=${certPath}`;
  }

  return `postgresql://${user}:${password}@${host}:${port}/${database}?schema=${schema}`;
}

const databaseUrl = getDatabaseUrl();

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function round2(value: number) {
  return Number(value.toFixed(2));
}

function buildRepaymentSchedule(
  applicationId: string,
  principal: number,
  annualRate: number,
  tenureMonths: number,
  startDate: Date,
  createdBy?: string,
) {
  const monthlyRate = annualRate / 12 / 100;
  const emi =
    monthlyRate === 0
      ? principal / tenureMonths
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
        (Math.pow(1 + monthlyRate, tenureMonths) - 1);

  let openingBalance = principal;

  return Array.from({ length: tenureMonths }, (_, index) => {
    const installmentNumber = index + 1;
    const interestComponent = round2(openingBalance * monthlyRate);
    const principalComponent = round2(emi - interestComponent);
    const installmentAmount = round2(principalComponent + interestComponent);
    const closingBalance =
      installmentNumber === tenureMonths ? 0 : round2(openingBalance - principalComponent);

    const row = {
      application_id: applicationId,
      installment_number: installmentNumber,
      due_date: addMonths(startDate, index + 1),
      opening_balance: openingBalance.toFixed(2),
      principal_component: principalComponent.toFixed(2),
      interest_component: interestComponent.toFixed(2),
      installment_amount: installmentAmount.toFixed(2),
      closing_balance: closingBalance.toFixed(2),
      paid_amount: '0.00',
      payment_status: 'PENDING',
      created_by: createdBy ?? null,
      updated_by: createdBy ?? null,
      is_active: true,
    };

    openingBalance = closingBalance;
    return row;
  });
}

function maskValue(value: string, visibleDigits = 4): string {
  if (value.length <= visibleDigits) {
    return value;
  }

  const hiddenLength = value.length - visibleDigits;
  return `${'X'.repeat(hiddenLength)}${value.slice(-visibleDigits)}`;
}

async function getRequiredUser(email: string) {
  const user = await prisma.users.findUnique({
    where: { email },
    select: {
      user_id: true,
      first_name: true,
      last_name: true,
      email: true,
    },
  });

  if (!user) {
    throw new Error(`Required seeded user not found: ${email}`);
  }

  return user;
}

async function getRequiredCustomer(firstName: string, lastName: string, dob: string) {
  const customer = await prisma.customer.findFirst({
    where: {
      first_name: firstName,
      last_name: lastName,
      date_of_birth: new Date(dob),
    },
    select: {
      customer_id: true,
      first_name: true,
      last_name: true,
    },
  });

  if (!customer) {
    throw new Error(`Required seeded customer not found: ${firstName} ${lastName}`);
  }

  return customer;
}

async function findOrCreateAddressType(
  addressTypeCode: string,
  addressTypeName: string,
  createdBy: string,
  updatedBy: string,
) {
  const existing = await prisma.address_types.findFirst({
    where: { address_type_code: addressTypeCode },
  });

  if (existing) {
    return existing;
  }

  return prisma.address_types.create({
    data: {
      address_type_code: addressTypeCode,
      address_type_name: addressTypeName,
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });
}

async function findOrCreateBank(
  bankCode: string,
  bankName: string,
  createdBy: string,
  updatedBy: string,
) {
  const existing = await prisma.banks.findFirst({
    where: { bank_code: bankCode },
  });

  if (existing) {
    return existing;
  }

  return prisma.banks.create({
    data: {
      bank_code: bankCode,
      bank_name: bankName,
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });
}

async function findOrCreateEmploymentType(
  employmentTypeCode: string,
  employmentTypeName: string,
  createdBy: string,
  updatedBy: string,
) {
  const existing = await prisma.employment_types.findFirst({
    where: { employment_type_code: employmentTypeCode },
  });

  if (existing) {
    return existing;
  }

  return prisma.employment_types.create({
    data: {
      employment_type_code: employmentTypeCode,
      employment_type_name: employmentTypeName,
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });
}

async function findOrCreateEducationLevel(
  levelCode: string,
  levelName: string,
  createdBy: string,
  updatedBy: string,
) {
  const existing = await prisma.education_levels.findFirst({
    where: { level_code: levelCode },
  });

  if (existing) {
    return existing;
  }

  return prisma.education_levels.create({
    data: {
      level_code: levelCode,
      level_name: levelName,
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });
}

async function findOrCreateInstitution(
  institutionName: string,
  city: string,
  country: string,
  createdBy: string,
  updatedBy: string,
) {
  const existing = await prisma.institutions.findFirst({
    where: { institution_name: institutionName },
  });

  if (existing) {
    return existing;
  }

  return prisma.institutions.create({
    data: {
      institution_name: institutionName,
      city,
      country,
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });
}

async function seedBase() {
  console.log('Starting seed...');

  const adminPassword = await bcrypt.hash('Victor@19880412.1001', 10);
  const sourcingPassword = await bcrypt.hash('Sukh@19981222.1002', 10);
  const underwriterPassword = await bcrypt.hash('Miswa@19910918.1003', 10);
  const disbursalPassword = await bcrypt.hash('Nirali@19990810.1004', 10);
  const customerPassword = await bcrypt.hash('Aman@19970214.1005', 10);

  await prisma.application_credit_check.deleteMany();
  await prisma.cibil_risk_indicators.deleteMany();
  await prisma.cibil_enquiries.deleteMany();
  await prisma.cibil_payment_history.deleteMany();
  await prisma.cibil_accounts.deleteMany();
  await prisma.cibil_applicants.deleteMany();
  await prisma.cibil_reports.deleteMany();
  await prisma.loan_payment.deleteMany();
  await prisma.repayment_schedule.deleteMany();
  await prisma.sub_loan.deleteMany();
  await prisma.application_action_history.deleteMany();
  await prisma.loan_application.deleteMany();
  await prisma.application_status_audit.deleteMany();
  await prisma.application_eligibility_summary.deleteMany();
  await prisma.eligibility_rule.deleteMany();
  await prisma.eligibility_rule_set.deleteMany();
  await prisma.application_message_attachment.deleteMany();
  await prisma.application_communication_history.deleteMany();
  await prisma.application_assignment.deleteMany();
  await prisma.team_members.deleteMany();
  await prisma.teams.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user_employment.deleteMany();
  await prisma.user_education.deleteMany();
  await prisma.user_bank_account.deleteMany();
  await prisma.user_address.deleteMany();
  await prisma.user_profile.deleteMany();
  await prisma.loan_product_config.deleteMany();
  await prisma.users.deleteMany();
  await prisma.loan_types.deleteMany();
  await prisma.institutions.deleteMany();
  await prisma.employment_types.deleteMany();
  await prisma.education_levels.deleteMany();
  await prisma.decision_types.deleteMany();
  await prisma.banks.deleteMany();
  await prisma.application_status.deleteMany();
  await prisma.address_types.deleteMany();
  await prisma.roles.deleteMany();

  const roleAdmin = await prisma.roles.create({
    data: {
      role_code: 'ADMIN',
      role_name: 'Administrator',
      is_active: true,
    },
  });

  const roleSourcingOfficer = await prisma.roles.create({
    data: {
      role_code: 'SOURCING_OFFICER',
      role_name: 'Sourcing Officer',
      is_active: true,
    },
  });

  const roleUnderwriter = await prisma.roles.create({
    data: {
      role_code: 'UNDERWRITER',
      role_name: 'Underwriter',
      is_active: true,
    },
  });

  const roleDisbursalOfficer = await prisma.roles.create({
    data: {
      role_code: 'DISBURSAL_OFFICER',
      role_name: 'Disbursal Officer',
      is_active: true,
    },
  });

  const roleCustomer = await prisma.roles.create({
    data: {
      role_code: 'CUSTOMER',
      role_name: 'Customer',
      is_active: true,
    },
  });

  const victor = await prisma.users.create({
    data: {
      role_id: roleAdmin.role_id,
      first_name: 'Victor',
      last_name: 'Admin',
      email: 'victor@creditpulse.com',
      password_hash: adminPassword,
      phone: '+1-519-555-1001',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const sukh = await prisma.users.create({
    data: {
      role_id: roleSourcingOfficer.role_id,
      first_name: 'Sukh',
      last_name: 'Bhambra',
      email: 'sukh@creditpulse.com',
      password_hash: sourcingPassword,
      phone: '+1-519-555-1002',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const miswa = await prisma.users.create({
    data: {
      role_id: roleUnderwriter.role_id,
      first_name: 'Miswa',
      last_name: 'Patel',
      email: 'miswa@creditpulse.com',
      password_hash: underwriterPassword,
      phone: '+1-519-555-1003',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const nirali = await prisma.users.create({
    data: {
      role_id: roleDisbursalOfficer.role_id,
      first_name: 'Nirali',
      last_name: 'Patel',
      email: 'nirali@creditpulse.com',
      password_hash: disbursalPassword,
      phone: '+1-519-555-1004',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const amanCustomer = await prisma.users.create({
    data: {
      role_id: roleCustomer.role_id,
      first_name: 'Aman',
      last_name: 'Sharma',
      email: 'aman.sharma@creditpulse.com',
      password_hash: customerPassword,
      phone: '+1-519-555-1005',
      is_email_verified: true,
      is_system_user: false,
      is_active: true,
    },
  });

  const joyal = await prisma.users.create({
    data: {
      role_id: roleSourcingOfficer.role_id,
      first_name: 'Joyal',
      last_name: 'Aji',
      email: 'joyal.aji@creditpulse.com',
      password_hash: sourcingPassword,
      phone: '+1-519-555-1101',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const praveen = await prisma.users.create({
    data: {
      role_id: roleSourcingOfficer.role_id,
      first_name: 'Praveen',
      last_name: 'Bangla',
      email: 'praveen.bangla@creditpulse.com',
      password_hash: sourcingPassword,
      phone: '+1-519-555-1102',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const yisa = await prisma.users.create({
    data: {
      role_id: roleSourcingOfficer.role_id,
      first_name: 'Yisa',
      last_name: 'Bankole',
      email: 'yisa.bankole@creditpulse.com',
      password_hash: sourcingPassword,
      phone: '+1-519-555-1103',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const sandip = await prisma.users.create({
    data: {
      role_id: roleSourcingOfficer.role_id,
      first_name: 'Sandip',
      last_name: 'Bharati',
      email: 'sandip.bharati@creditpulse.com',
      password_hash: sourcingPassword,
      phone: '+1-519-555-1104',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const birav = await prisma.users.create({
    data: {
      role_id: roleSourcingOfficer.role_id,
      first_name: 'Birav',
      last_name: 'Bhattrai',
      email: 'birav.bhattrai@creditpulse.com',
      password_hash: sourcingPassword,
      phone: '+1-519-555-1105',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const shikha = await prisma.users.create({
    data: {
      role_id: roleSourcingOfficer.role_id,
      first_name: 'Shikha',
      last_name: 'Desai',
      email: 'shikha.desai@creditpulse.com',
      password_hash: sourcingPassword,
      phone: '+1-519-555-1106',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const victorEnejo = await prisma.users.create({
    data: {
      role_id: roleSourcingOfficer.role_id,
      first_name: 'Victor',
      last_name: 'Enejo',
      email: 'victor.enejo@creditpulse.com',
      password_hash: sourcingPassword,
      phone: '+1-519-555-1107',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const kandarpgiri = await prisma.users.create({
    data: {
      role_id: roleSourcingOfficer.role_id,
      first_name: 'Kandarpgiri',
      last_name: 'Gosai',
      email: 'kandarpgiri.gosai@creditpulse.com',
      password_hash: sourcingPassword,
      phone: '+1-519-555-1108',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const nisargkumar = await prisma.users.create({
    data: {
      role_id: roleSourcingOfficer.role_id,
      first_name: 'Nisargkumar',
      last_name: 'Goswami',
      email: 'nisargkumar.goswami@creditpulse.com',
      password_hash: sourcingPassword,
      phone: '+1-519-555-1109',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const gurpreet = await prisma.users.create({
    data: {
      role_id: roleSourcingOfficer.role_id,
      first_name: 'Gurpreet',
      last_name: 'Singh',
      email: 'gurpreet.singh@creditpulse.com',
      password_hash: sourcingPassword,
      phone: '+1-519-555-1110',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const tyler = await prisma.users.create({
    data: {
      role_id: roleUnderwriter.role_id,
      first_name: 'Tyler',
      last_name: 'Kobe',
      email: 'tyler.kobe@creditpulse.com',
      password_hash: underwriterPassword,
      phone: '+1-519-555-1201',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const sherrice = await prisma.users.create({
    data: {
      role_id: roleUnderwriter.role_id,
      first_name: 'Sherrice',
      last_name: 'Lyons',
      email: 'sherrice.lyons@creditpulse.com',
      password_hash: underwriterPassword,
      phone: '+1-519-555-1202',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const shahid = await prisma.users.create({
    data: {
      role_id: roleUnderwriter.role_id,
      first_name: 'Shahid',
      last_name: 'Mahammed',
      email: 'shahid.mahammed@creditpulse.com',
      password_hash: underwriterPassword,
      phone: '+1-519-555-1203',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const rajavardhan = await prisma.users.create({
    data: {
      role_id: roleUnderwriter.role_id,
      first_name: 'Rajavardhan',
      last_name: 'Reddy',
      email: 'rajavardhan.reddy@creditpulse.com',
      password_hash: underwriterPassword,
      phone: '+1-519-555-1204',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const aakash = await prisma.users.create({
    data: {
      role_id: roleUnderwriter.role_id,
      first_name: 'Aakash',
      last_name: 'Nair',
      email: 'aakash.nair@creditpulse.com',
      password_hash: underwriterPassword,
      phone: '+1-519-555-1205',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const james = await prisma.users.create({
    data: {
      role_id: roleUnderwriter.role_id,
      first_name: 'James',
      last_name: 'Okeke',
      email: 'james.okeke@creditpulse.com',
      password_hash: underwriterPassword,
      phone: '+1-519-555-1206',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const emmanuel = await prisma.users.create({
    data: {
      role_id: roleUnderwriter.role_id,
      first_name: 'Emmanuel',
      last_name: 'Raji',
      email: 'emmanuel.raji@creditpulse.com',
      password_hash: underwriterPassword,
      phone: '+1-519-555-1207',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const rutvik = await prisma.users.create({
    data: {
      role_id: roleUnderwriter.role_id,
      first_name: 'Rutvik',
      last_name: 'Patel',
      email: 'rutvik.patel@creditpulse.com',
      password_hash: underwriterPassword,
      phone: '+1-519-555-1208',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const vatsal = await prisma.users.create({
    data: {
      role_id: roleUnderwriter.role_id,
      first_name: 'Vatsal',
      last_name: 'Patel',
      email: 'vatsal.patel@creditpulse.com',
      password_hash: underwriterPassword,
      phone: '+1-519-555-1209',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const prabhjot = await prisma.users.create({
    data: {
      role_id: roleUnderwriter.role_id,
      first_name: 'Prabhjot',
      last_name: 'Singh',
      email: 'prabhjot.singh@creditpulse.com',
      password_hash: underwriterPassword,
      phone: '+1-519-555-1210',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const vishwa = await prisma.users.create({
    data: {
      role_id: roleDisbursalOfficer.role_id,
      first_name: 'Vishwa',
      last_name: 'Rana',
      email: 'vishwa.rana@creditpulse.com',
      password_hash: disbursalPassword,
      phone: '+1-519-555-1301',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const dhruti = await prisma.users.create({
    data: {
      role_id: roleDisbursalOfficer.role_id,
      first_name: 'Dhruti',
      last_name: 'Rathod',
      email: 'dhruti.rathod@creditpulse.com',
      password_hash: disbursalPassword,
      phone: '+1-519-555-1302',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const rajKumar = await prisma.users.create({
    data: {
      role_id: roleDisbursalOfficer.role_id,
      first_name: 'Raj',
      last_name: 'Kumar',
      email: 'raj.kumar@creditpulse.com',
      password_hash: disbursalPassword,
      phone: '+1-519-555-1303',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const honey = await prisma.users.create({
    data: {
      role_id: roleDisbursalOfficer.role_id,
      first_name: 'Honey',
      last_name: 'Singh',
      email: 'honey.singh@creditpulse.com',
      password_hash: disbursalPassword,
      phone: '+1-519-555-1304',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const parminder = await prisma.users.create({
    data: {
      role_id: roleDisbursalOfficer.role_id,
      first_name: 'Parminder',
      last_name: 'Singh',
      email: 'parminder.singh@creditpulse.com',
      password_hash: disbursalPassword,
      phone: '+1-519-555-1305',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const christ = await prisma.users.create({
    data: {
      role_id: roleDisbursalOfficer.role_id,
      first_name: 'Christ',
      last_name: 'Vijay',
      email: 'christ.vijay@creditpulse.com',
      password_hash: disbursalPassword,
      phone: '+1-519-555-1306',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const ansh = await prisma.users.create({
    data: {
      role_id: roleDisbursalOfficer.role_id,
      first_name: 'Ansh',
      last_name: 'Sukhija',
      email: 'ansh.sukhija@creditpulse.com',
      password_hash: disbursalPassword,
      phone: '+1-519-555-1307',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const sukhjit = await prisma.users.create({
    data: {
      role_id: roleDisbursalOfficer.role_id,
      first_name: 'Sukhjit',
      last_name: 'Kaur',
      email: 'sukhjit.kaur@creditpulse.com',
      password_hash: disbursalPassword,
      phone: '+1-519-555-1308',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const teena = await prisma.users.create({
    data: {
      role_id: roleDisbursalOfficer.role_id,
      first_name: 'Teena',
      last_name: 'Thomas',
      email: 'teena.thomas@creditpulse.com',
      password_hash: disbursalPassword,
      phone: '+1-519-555-1309',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const createdBy = victor.user_id;
  const updatedBy = victor.user_id;

  await prisma.roles.updateMany({
    data: {
      created_by: createdBy,
      updated_by: updatedBy,
    },
  });

  const homeAddressType = await prisma.address_types.create({
    data: {
      address_type_code: 'HOME',
      address_type_name: 'Home Address',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const workAddressType = await prisma.address_types.create({
    data: {
      address_type_code: 'WORK',
      address_type_name: 'Work Address',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const submittedStatus = await prisma.application_status.create({
    data: {
      status_code: 'SUBMITTED',
      status_name: 'Submitted',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const creditCheckCompletedStatus = await prisma.application_status.create({
    data: {
      status_code: 'CREDIT_CHECK_COMPLETED',
      status_name: 'Credit Check Completed',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const underReviewStatus = await prisma.application_status.create({
    data: {
      status_code: 'UNDER_REVIEW',
      status_name: 'Under Review',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const approvedStatus = await prisma.application_status.create({
    data: {
      status_code: 'APPROVED',
      status_name: 'Approved',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const rejectedStatus = await prisma.application_status.create({
    data: {
      status_code: 'REJECTED',
      status_name: 'Rejected',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const disbursedStatus = await prisma.application_status.create({
    data: {
      status_code: 'DISBURSED',
      status_name: 'Disbursed',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const bank1 = await prisma.banks.create({
    data: {
      bank_code: 'RBC',
      bank_name: 'Royal Bank of Canada',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const bank2 = await prisma.banks.create({
    data: {
      bank_code: 'TD',
      bank_name: 'Toronto-Dominion Bank',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const bank3 = await prisma.banks.create({
    data: {
      bank_code: 'CIBC',
      bank_name: 'Canadian Imperial Bank of Commerce',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  await prisma.decision_types.createMany({
    data: [
      {
        decision_code: 'APPROVE',
        decision_name: 'Approve',
        created_by: createdBy,
        updated_by: updatedBy,
        is_active: true,
      },
      {
        decision_code: 'REJECT',
        decision_name: 'Reject',
        created_by: createdBy,
        updated_by: updatedBy,
        is_active: true,
      },
      {
        decision_code: 'REFER',
        decision_name: 'Refer',
        created_by: createdBy,
        updated_by: updatedBy,
        is_active: true,
      },
    ],
  });

  const eduBachelors = await prisma.education_levels.create({
    data: {
      level_code: 'BACHELORS',
      level_name: 'Bachelors',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const eduMasters = await prisma.education_levels.create({
    data: {
      level_code: 'MASTERS',
      level_name: 'Masters',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const employmentFullTime = await prisma.employment_types.create({
    data: {
      employment_type_code: 'FULL_TIME',
      employment_type_name: 'Full Time',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const employmentPartTime = await prisma.employment_types.create({
    data: {
      employment_type_code: 'PART_TIME',
      employment_type_name: 'Part Time',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const institution1 = await prisma.institutions.create({
    data: {
      institution_name: 'Conestoga College',
      city: 'Kitchener',
      country: 'Canada',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const institution2 = await prisma.institutions.create({
    data: {
      institution_name: 'University of Toronto',
      city: 'Toronto',
      country: 'Canada',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const institution3 = await prisma.institutions.create({
    data: {
      institution_name: 'McMaster University',
      city: 'Hamilton',
      country: 'Canada',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const personalLoanType = await prisma.loan_types.create({
    data: {
      loan_type_code: 'PERSONAL',
      loan_type_name: 'Personal Loan',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const educationLoanType = await prisma.loan_types.create({
    data: {
      loan_type_code: 'EDUCATION',
      loan_type_name: 'Education Loan',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const businessLoanType = await prisma.loan_types.create({
    data: {
      loan_type_code: 'BUSINESS',
      loan_type_name: 'Business Loan',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const mortgageLoanType = await prisma.loan_types.create({
    data: {
      loan_type_code: 'MORTGAGE',
      loan_type_name: 'Mortgage Loan',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  await prisma.loan_product_config.createMany({
    data: [
      {
        loan_type_id: personalLoanType.loan_type_id,
        min_amount: '5000.00',
        max_amount: '50000.00',
        min_tenure_months: 6,
        max_tenure_months: 60,
        min_interest_rate: '10.50',
        max_interest_rate: '18.00',
        processing_fee_percent: '2.00',
        created_by: createdBy,
        updated_by: updatedBy,
        is_active: true,
      },
      {
        loan_type_id: educationLoanType.loan_type_id,
        min_amount: '10000.00',
        max_amount: '100000.00',
        min_tenure_months: 12,
        max_tenure_months: 84,
        min_interest_rate: '8.50',
        max_interest_rate: '14.00',
        processing_fee_percent: '1.50',
        created_by: createdBy,
        updated_by: updatedBy,
        is_active: true,
      },
      {
        loan_type_id: businessLoanType.loan_type_id,
        min_amount: '20000.00',
        max_amount: '250000.00',
        min_tenure_months: 12,
        max_tenure_months: 72,
        min_interest_rate: '11.00',
        max_interest_rate: '19.50',
        processing_fee_percent: '2.50',
        created_by: createdBy,
        updated_by: updatedBy,
        is_active: true,
      },
      {
        loan_type_id: mortgageLoanType.loan_type_id,
        min_amount: '50000.00',
        max_amount: '1000000.00',
        min_tenure_months: 60,
        max_tenure_months: 360,
        min_interest_rate: '6.50',
        max_interest_rate: '10.50',
        processing_fee_percent: '1.00',
        created_by: createdBy,
        updated_by: updatedBy,
        is_active: true,
      },
    ],
  });

  await prisma.user_profile.createMany({
    data: [
      {
        user_id: victor.user_id,
        date_of_birth: new Date('1988-04-12'),
        gender: 'Male',
        marital_status: 'Married',
        nationality: 'Canadian',
        government_id_type: 'SIN',
        government_id_number: '1001',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: sukh.user_id,
        date_of_birth: new Date('1998-12-22'),
        gender: 'Male',
        marital_status: 'Single',
        nationality: 'Indian',
        government_id_type: 'SIN',
        government_id_number: '1002',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: miswa.user_id,
        date_of_birth: new Date('1991-09-18'),
        gender: 'Female',
        marital_status: 'Single',
        nationality: 'Canadian',
        government_id_type: 'SIN',
        government_id_number: '1003',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: nirali.user_id,
        date_of_birth: new Date('1999-08-10'),
        gender: 'Female',
        marital_status: 'Single',
        nationality: 'Indian',
        government_id_type: 'SIN',
        government_id_number: '1004',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: amanCustomer.user_id,
        date_of_birth: new Date('1997-02-14'),
        gender: 'Male',
        marital_status: 'Single',
        nationality: 'Indian',
        government_id_type: 'SIN',
        government_id_number: '1005',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: joyal.user_id,
        date_of_birth: new Date('1996-01-15'),
        gender: 'Male',
        marital_status: 'Single',
        nationality: 'Indian',
        government_id_type: 'SIN',
        government_id_number: '1101',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: praveen.user_id,
        date_of_birth: new Date('1995-03-22'),
        gender: 'Male',
        marital_status: 'Married',
        nationality: 'Indian',
        government_id_type: 'SIN',
        government_id_number: '1102',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: yisa.user_id,
        date_of_birth: new Date('1994-07-11'),
        gender: 'Male',
        marital_status: 'Single',
        nationality: 'Nigerian',
        government_id_type: 'SIN',
        government_id_number: '1103',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: sandip.user_id,
        date_of_birth: new Date('1997-09-05'),
        gender: 'Male',
        marital_status: 'Single',
        nationality: 'Indian',
        government_id_type: 'SIN',
        government_id_number: '1104',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: birav.user_id,
        date_of_birth: new Date('1998-02-19'),
        gender: 'Male',
        marital_status: 'Single',
        nationality: 'Nepalese',
        government_id_type: 'SIN',
        government_id_number: '1105',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: shikha.user_id,
        date_of_birth: new Date('1996-11-28'),
        gender: 'Female',
        marital_status: 'Married',
        nationality: 'Indian',
        government_id_type: 'SIN',
        government_id_number: '1106',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: victorEnejo.user_id,
        date_of_birth: new Date('1993-04-14'),
        gender: 'Male',
        marital_status: 'Single',
        nationality: 'Nigerian',
        government_id_type: 'SIN',
        government_id_number: '1107',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: kandarpgiri.user_id,
        date_of_birth: new Date('1995-08-30'),
        gender: 'Male',
        marital_status: 'Single',
        nationality: 'Indian',
        government_id_type: 'SIN',
        government_id_number: '1108',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: nisargkumar.user_id,
        date_of_birth: new Date('1997-05-10'),
        gender: 'Male',
        marital_status: 'Single',
        nationality: 'Indian',
        government_id_type: 'SIN',
        government_id_number: '1109',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: gurpreet.user_id,
        date_of_birth: new Date('1994-12-18'),
        gender: 'Male',
        marital_status: 'Married',
        nationality: 'Indian',
        government_id_type: 'SIN',
        government_id_number: '1110',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: tyler.user_id,
        date_of_birth: new Date('1992-06-09'),
        gender: 'Male',
        marital_status: 'Single',
        nationality: 'Canadian',
        government_id_type: 'SIN',
        government_id_number: '1201',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: sherrice.user_id,
        date_of_birth: new Date('1991-10-27'),
        gender: 'Female',
        marital_status: 'Single',
        nationality: 'Canadian',
        government_id_type: 'SIN',
        government_id_number: '1202',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: shahid.user_id,
        date_of_birth: new Date('1993-01-31'),
        gender: 'Male',
        marital_status: 'Married',
        nationality: 'Indian',
        government_id_type: 'SIN',
        government_id_number: '1203',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: rajavardhan.user_id,
        date_of_birth: new Date('1995-07-20'),
        gender: 'Male',
        marital_status: 'Single',
        nationality: 'Indian',
        government_id_type: 'SIN',
        government_id_number: '1204',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: aakash.user_id,
        date_of_birth: new Date('1996-09-16'),
        gender: 'Male',
        marital_status: 'Single',
        nationality: 'Indian',
        government_id_type: 'SIN',
        government_id_number: '1205',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: james.user_id,
        date_of_birth: new Date('1990-02-12'),
        gender: 'Male',
        marital_status: 'Married',
        nationality: 'Nigerian',
        government_id_type: 'SIN',
        government_id_number: '1206',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: emmanuel.user_id,
        date_of_birth: new Date('1992-11-04'),
        gender: 'Male',
        marital_status: 'Single',
        nationality: 'Nigerian',
        government_id_type: 'SIN',
        government_id_number: '1207',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: rutvik.user_id,
        date_of_birth: new Date('1997-04-25'),
        gender: 'Male',
        marital_status: 'Single',
        nationality: 'Indian',
        government_id_type: 'SIN',
        government_id_number: '1208',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: vatsal.user_id,
        date_of_birth: new Date('1995-06-14'),
        gender: 'Male',
        marital_status: 'Single',
        nationality: 'Indian',
        government_id_type: 'SIN',
        government_id_number: '1209',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: prabhjot.user_id,
        date_of_birth: new Date('1994-08-08'),
        gender: 'Male',
        marital_status: 'Married',
        nationality: 'Indian',
        government_id_type: 'SIN',
        government_id_number: '1210',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: vishwa.user_id,
        date_of_birth: new Date('1998-03-03'),
        gender: 'Male',
        marital_status: 'Single',
        nationality: 'Indian',
        government_id_type: 'SIN',
        government_id_number: '1301',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: dhruti.user_id,
        date_of_birth: new Date('1997-12-09'),
        gender: 'Female',
        marital_status: 'Single',
        nationality: 'Indian',
        government_id_type: 'SIN',
        government_id_number: '1302',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: rajKumar.user_id,
        date_of_birth: new Date('1993-05-21'),
        gender: 'Male',
        marital_status: 'Married',
        nationality: 'Indian',
        government_id_type: 'SIN',
        government_id_number: '1303',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: honey.user_id,
        date_of_birth: new Date('1996-10-13'),
        gender: 'Male',
        marital_status: 'Single',
        nationality: 'Indian',
        government_id_type: 'SIN',
        government_id_number: '1304',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: parminder.user_id,
        date_of_birth: new Date('1992-01-17'),
        gender: 'Male',
        marital_status: 'Married',
        nationality: 'Indian',
        government_id_type: 'SIN',
        government_id_number: '1305',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: christ.user_id,
        date_of_birth: new Date('1994-07-07'),
        gender: 'Male',
        marital_status: 'Single',
        nationality: 'Indian',
        government_id_type: 'SIN',
        government_id_number: '1306',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: ansh.user_id,
        date_of_birth: new Date('1998-09-29'),
        gender: 'Male',
        marital_status: 'Single',
        nationality: 'Indian',
        government_id_type: 'SIN',
        government_id_number: '1307',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: sukhjit.user_id,
        date_of_birth: new Date('1997-02-24'),
        gender: 'Female',
        marital_status: 'Married',
        nationality: 'Indian',
        government_id_type: 'SIN',
        government_id_number: '1308',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        user_id: teena.user_id,
        date_of_birth: new Date('1995-11-11'),
        gender: 'Female',
        marital_status: 'Single',
        nationality: 'Indian',
        government_id_type: 'SIN',
        government_id_number: '1309',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
    ],
  });

  await prisma.user_address.createMany({
    data: [
      {
        user_id: victor.user_id,
        address_type_id: homeAddressType.address_type_id,
        line1: '101 King St W',
        city: 'Kitchener',
        state_province: 'ON',
        postal_code: 'N2G 1A1',
        country: 'Canada',
        is_primary: true,
        created_by: createdBy,
        updated_by: updatedBy,
        is_active: true,
      },
      {
        user_id: miswa.user_id,
        address_type_id: homeAddressType.address_type_id,
        line1: '220 Weber St E',
        city: 'Kitchener',
        state_province: 'ON',
        postal_code: 'N2H 1E4',
        country: 'Canada',
        is_primary: true,
        created_by: createdBy,
        updated_by: updatedBy,
        is_active: true,
      },
      {
        user_id: nirali.user_id,
        address_type_id: homeAddressType.address_type_id,
        line1: '15 Queen St S',
        city: 'Kitchener',
        state_province: 'ON',
        postal_code: 'N2G 1V6',
        country: 'Canada',
        is_primary: true,
        created_by: createdBy,
        updated_by: updatedBy,
        is_active: true,
      },
      {
        user_id: sukh.user_id,
        address_type_id: workAddressType.address_type_id,
        line1: '299 Doon Valley Dr',
        city: 'Kitchener',
        state_province: 'ON',
        postal_code: 'N2G 4M4',
        country: 'Canada',
        is_primary: true,
        created_by: createdBy,
        updated_by: updatedBy,
        is_active: true,
      },
    ],
  });

  await prisma.user_bank_account.createMany({
    data: [
      {
        user_id: victor.user_id,
        bank_id: bank1.bank_id,
        account_holder_name: 'Victor Admin',
        account_number: 'RBC10000001',
        account_type: 'CHEQUING',
        ifsc_routing_code: 'RBC001',
        branch_name: 'Downtown Kitchener',
        created_by: createdBy,
        updated_by: updatedBy,
        is_active: true,
      },
      {
        user_id: miswa.user_id,
        bank_id: bank2.bank_id,
        account_holder_name: 'Miswa Analyst',
        account_number: 'TD10000002',
        account_type: 'SAVINGS',
        ifsc_routing_code: 'TD002',
        branch_name: 'Fairway Road',
        created_by: createdBy,
        updated_by: updatedBy,
        is_active: true,
      },
      {
        user_id: nirali.user_id,
        bank_id: bank3.bank_id,
        account_holder_name: 'Nirali Patel',
        account_number: 'CIBC10000003',
        account_type: 'CHEQUING',
        ifsc_routing_code: 'CIBC003',
        branch_name: 'Conestoga Mall',
        created_by: createdBy,
        updated_by: updatedBy,
        is_active: true,
      },
      {
        user_id: sukh.user_id,
        bank_id: bank1.bank_id,
        account_holder_name: 'Sukh Bhambra',
        account_number: 'RBC10000004',
        account_type: 'CHEQUING',
        ifsc_routing_code: 'RBC004',
        branch_name: 'Sportsworld',
        created_by: createdBy,
        updated_by: updatedBy,
        is_active: true,
      },
    ],
  });

  await prisma.user_education.createMany({
    data: [
      {
        user_id: victor.user_id,
        education_level_id: eduMasters.education_level_id,
        institution_id: institution2.institution_id,
        program_name: 'MBA',
        start_date: new Date('2011-09-01'),
        end_date: new Date('2013-06-01'),
        grade_percent: '82.50',
        created_by: createdBy,
        updated_by: updatedBy,
        is_active: true,
      },
      {
        user_id: miswa.user_id,
        education_level_id: eduBachelors.education_level_id,
        institution_id: institution3.institution_id,
        program_name: 'Bachelor of Commerce',
        start_date: new Date('2009-09-01'),
        end_date: new Date('2013-05-01'),
        grade_percent: '78.20',
        created_by: createdBy,
        updated_by: updatedBy,
        is_active: true,
      },
      {
        user_id: nirali.user_id,
        education_level_id: eduBachelors.education_level_id,
        institution_id: institution1.institution_id,
        program_name: 'Web Development',
        start_date: new Date('2024-01-08'),
        end_date: new Date('2026-04-25'),
        grade_percent: '86.40',
        created_by: createdBy,
        updated_by: updatedBy,
        is_active: true,
      },
      {
        user_id: sukh.user_id,
        education_level_id: eduBachelors.education_level_id,
        institution_id: institution1.institution_id,
        program_name: 'Computer Programming',
        start_date: new Date('2024-01-08'),
        end_date: new Date('2026-04-25'),
        grade_percent: '84.10',
        created_by: createdBy,
        updated_by: updatedBy,
        is_active: true,
      },
    ],
  });

  await prisma.user_employment.createMany({
    data: [
      {
        user_id: victor.user_id,
        employment_type_id: employmentFullTime.employment_type_id,
        employer_name: 'CreditPulse',
        job_title: 'Platform Administrator',
        monthly_income: '8500.00',
        start_date: new Date('2022-01-01'),
        created_by: createdBy,
        updated_by: updatedBy,
        is_active: true,
      },
      {
        user_id: miswa.user_id,
        employment_type_id: employmentFullTime.employment_type_id,
        employer_name: 'CreditPulse',
        job_title: 'Senior Credit Analyst',
        monthly_income: '7200.00',
        start_date: new Date('2022-09-01'),
        created_by: createdBy,
        updated_by: updatedBy,
        is_active: true,
      },
      {
        user_id: nirali.user_id,
        employment_type_id: employmentPartTime.employment_type_id,
        employer_name: 'Conestoga College',
        job_title: 'Student Worker',
        monthly_income: '2200.00',
        start_date: new Date('2025-09-01'),
        created_by: createdBy,
        updated_by: updatedBy,
        is_active: true,
      },
      {
        user_id: sukh.user_id,
        employment_type_id: employmentPartTime.employment_type_id,
        employer_name: 'Conestoga College',
        job_title: 'IT Field Operations Student Technician',
        monthly_income: '2600.00',
        start_date: new Date('2025-10-01'),
        created_by: createdBy,
        updated_by: updatedBy,
        is_active: true,
      },
    ],
  });

  const customer1 = await prisma.customer.create({
    data: {
      first_name: 'Aman',
      last_name: 'Sharma',
      date_of_birth: new Date('1997-02-14'),
      created_by: nirali.user_id,
      updated_by: nirali.user_id,
      is_active: true,
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      first_name: 'Priya',
      last_name: 'Verma',
      date_of_birth: new Date('1995-11-03'),
      created_by: sukh.user_id,
      updated_by: sukh.user_id,
      is_active: true,
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      first_name: 'Rahul',
      last_name: 'Singh',
      date_of_birth: new Date('1992-07-28'),
      created_by: miswa.user_id,
      updated_by: miswa.user_id,
      is_active: true,
    },
  });

  const customer4 = await prisma.customer.create({
    data: {
      first_name: 'Simran',
      last_name: 'Kaur',
      date_of_birth: new Date('2000-05-19'),
      created_by: nirali.user_id,
      updated_by: nirali.user_id,
      is_active: true,
    },
  });

  const additionalApplicantConfigs = [
    {
      first_name: 'Aman',
      last_name: 'Joshi',
      date_of_birth: new Date('1991-03-14'),
      created_by: sukh.user_id,
    },
    {
      first_name: 'Neha',
      last_name: 'Shah',
      date_of_birth: new Date('1997-09-08'),
      created_by: nirali.user_id,
    },
    {
      first_name: 'Dev',
      last_name: 'Patel',
      date_of_birth: new Date('1990-12-22'),
      created_by: victor.user_id,
    },
    {
      first_name: 'Isha',
      last_name: 'Nair',
      date_of_birth: new Date('1998-04-17'),
      created_by: miswa.user_id,
    },
    {
      first_name: 'Kabir',
      last_name: 'Arora',
      date_of_birth: new Date('1993-10-05'),
      created_by: sukh.user_id,
    },
    {
      first_name: 'Meera',
      last_name: 'Sethi',
      date_of_birth: new Date('1996-01-29'),
      created_by: nirali.user_id,
    },
    {
      first_name: 'Arjun',
      last_name: 'Rao',
      date_of_birth: new Date('1989-06-11'),
      created_by: victor.user_id,
    },
    {
      first_name: 'Pooja',
      last_name: 'Bansal',
      date_of_birth: new Date('1994-08-23'),
      created_by: miswa.user_id,
    },
    {
      first_name: 'Ritika',
      last_name: 'Malik',
      date_of_birth: new Date('1992-11-16'),
      created_by: sukh.user_id,
    },
    {
      first_name: 'Yash',
      last_name: 'Khanna',
      date_of_birth: new Date('1995-02-07'),
      created_by: nirali.user_id,
    },
    {
      first_name: 'Sneha',
      last_name: 'Gill',
      date_of_birth: new Date('1999-05-26'),
      created_by: victor.user_id,
    },
    {
      first_name: 'Kunal',
      last_name: 'Bedi',
      date_of_birth: new Date('1991-09-19'),
      created_by: miswa.user_id,
    },
    {
      first_name: 'Nisha',
      last_name: 'Chopra',
      date_of_birth: new Date('1997-12-03'),
      created_by: sukh.user_id,
    },
    {
      first_name: 'Harsh',
      last_name: 'Saxena',
      date_of_birth: new Date('1988-07-30'),
      created_by: nirali.user_id,
    },
    {
      first_name: 'Tanya',
      last_name: 'Ahuja',
      date_of_birth: new Date('2000-03-09'),
      created_by: victor.user_id,
    },
  ];

  const additionalCustomers: Array<{ customer_id: string }> = [];

  for (const applicantConfig of additionalApplicantConfigs) {
    const customer = await prisma.customer.create({
      data: {
        first_name: applicantConfig.first_name,
        last_name: applicantConfig.last_name,
        date_of_birth: applicantConfig.date_of_birth,
        created_by: applicantConfig.created_by,
        updated_by: applicantConfig.created_by,
        is_active: true,
      },
    });

    additionalCustomers.push(customer);
  }

  const app1 = await prisma.loan_application.create({
    data: {
      application_number: 'APPL0000000001',
      status_id: submittedStatus.status_id,
      loan_type_id: personalLoanType.loan_type_id,
      requested_amount: '15000.00',
      tenure_months: 12,
      interest_rate: '10.50',
      created_by: nirali.user_id,
      updated_by: nirali.user_id,
      is_active: true,
    },
  });

  const app2 = await prisma.loan_application.create({
    data: {
      application_number: 'APPL0000000002',
      status_id: underReviewStatus.status_id,
      loan_type_id: educationLoanType.loan_type_id,
      requested_amount: '28000.00',
      tenure_months: 24,
      interest_rate: '9.25',
      created_by: miswa.user_id,
      updated_by: miswa.user_id,
      is_active: true,
    },
  });

  const app3 = await prisma.loan_application.create({
    data: {
      application_number: 'APPL0000000003',
      status_id: approvedStatus.status_id,
      loan_type_id: businessLoanType.loan_type_id,
      requested_amount: '50000.00',
      tenure_months: 18,
      interest_rate: '11.75',
      created_by: victor.user_id,
      updated_by: victor.user_id,
      is_active: true,
    },
  });

  const app4 = await prisma.loan_application.create({
    data: {
      application_number: 'APPL0000000004',
      status_id: disbursedStatus.status_id,
      loan_type_id: mortgageLoanType.loan_type_id,
      requested_amount: '125000.00',
      tenure_months: 36,
      interest_rate: '7.95',
      created_by: victor.user_id,
      updated_by: victor.user_id,
      is_active: true,
    },
  });

  const app5 = await prisma.loan_application.create({
    data: {
      application_number: 'APPL0000000005',
      status_id: rejectedStatus.status_id,
      loan_type_id: personalLoanType.loan_type_id,
      requested_amount: '8000.00',
      tenure_months: 10,
      interest_rate: '13.50',
      created_by: sukh.user_id,
      updated_by: sukh.user_id,
      is_active: true,
    },
  });

  const additionalApplicationConfigs = [
    {
      application_number: 'APPL0000000006',
      status_id: submittedStatus.status_id,
      loan_type_id: educationLoanType.loan_type_id,
      requested_amount: '22000.00',
      tenure_months: 18,
      interest_rate: '8.95',
      created_by: sukh.user_id,
    },
    {
      application_number: 'APPL0000000007',
      status_id: underReviewStatus.status_id,
      loan_type_id: personalLoanType.loan_type_id,
      requested_amount: '18000.00',
      tenure_months: 15,
      interest_rate: '10.10',
      created_by: nirali.user_id,
    },
    {
      application_number: 'APPL0000000008',
      status_id: approvedStatus.status_id,
      loan_type_id: mortgageLoanType.loan_type_id,
      requested_amount: '98000.00',
      tenure_months: 30,
      interest_rate: '7.65',
      created_by: victor.user_id,
    },
    {
      application_number: 'APPL0000000009',
      status_id: disbursedStatus.status_id,
      loan_type_id: businessLoanType.loan_type_id,
      requested_amount: '64000.00',
      tenure_months: 20,
      interest_rate: '12.20',
      created_by: miswa.user_id,
    },
    {
      application_number: 'APPL0000000010',
      status_id: rejectedStatus.status_id,
      loan_type_id: personalLoanType.loan_type_id,
      requested_amount: '12000.00',
      tenure_months: 9,
      interest_rate: '14.10',
      created_by: sukh.user_id,
    },
    {
      application_number: 'APPL0000000011',
      status_id: creditCheckCompletedStatus.status_id,
      loan_type_id: businessLoanType.loan_type_id,
      requested_amount: '45000.00',
      tenure_months: 24,
      interest_rate: '11.20',
      created_by: nirali.user_id,
    },
    {
      application_number: 'APPL0000000012',
      status_id: underReviewStatus.status_id,
      loan_type_id: mortgageLoanType.loan_type_id,
      requested_amount: '150000.00',
      tenure_months: 48,
      interest_rate: '7.45',
      created_by: victor.user_id,
    },
    {
      application_number: 'APPL0000000013',
      status_id: approvedStatus.status_id,
      loan_type_id: educationLoanType.loan_type_id,
      requested_amount: '32000.00',
      tenure_months: 36,
      interest_rate: '8.50',
      created_by: miswa.user_id,
    },
    {
      application_number: 'APPL0000000014',
      status_id: disbursedStatus.status_id,
      loan_type_id: personalLoanType.loan_type_id,
      requested_amount: '27000.00',
      tenure_months: 16,
      interest_rate: '10.80',
      created_by: sukh.user_id,
    },
    {
      application_number: 'APPL0000000015',
      status_id: rejectedStatus.status_id,
      loan_type_id: businessLoanType.loan_type_id,
      requested_amount: '53000.00',
      tenure_months: 22,
      interest_rate: '13.25',
      created_by: nirali.user_id,
    },
    {
      application_number: 'APPL0000000016',
      status_id: submittedStatus.status_id,
      loan_type_id: mortgageLoanType.loan_type_id,
      requested_amount: '175000.00',
      tenure_months: 60,
      interest_rate: '7.15',
      created_by: victor.user_id,
    },
    {
      application_number: 'APPL0000000017',
      status_id: underReviewStatus.status_id,
      loan_type_id: personalLoanType.loan_type_id,
      requested_amount: '19500.00',
      tenure_months: 14,
      interest_rate: '10.35',
      created_by: miswa.user_id,
    },
    {
      application_number: 'APPL0000000018',
      status_id: approvedStatus.status_id,
      loan_type_id: educationLoanType.loan_type_id,
      requested_amount: '41000.00',
      tenure_months: 30,
      interest_rate: '8.75',
      created_by: sukh.user_id,
    },
    {
      application_number: 'APPL0000000019',
      status_id: disbursedStatus.status_id,
      loan_type_id: businessLoanType.loan_type_id,
      requested_amount: '72000.00',
      tenure_months: 28,
      interest_rate: '12.05',
      created_by: nirali.user_id,
    },
    {
      application_number: 'APPL0000000020',
      status_id: rejectedStatus.status_id,
      loan_type_id: personalLoanType.loan_type_id,
      requested_amount: '9500.00',
      tenure_months: 8,
      interest_rate: '14.40',
      created_by: victor.user_id,
    },
  ];

  const additionalApplications: Array<{ application_id: string }> = [];

  for (const applicationConfig of additionalApplicationConfigs) {
    const application = await prisma.loan_application.create({
      data: {
        application_number: applicationConfig.application_number,
        status_id: applicationConfig.status_id,
        loan_type_id: applicationConfig.loan_type_id,
        requested_amount: applicationConfig.requested_amount,
        tenure_months: applicationConfig.tenure_months,
        interest_rate: applicationConfig.interest_rate,
        created_by: applicationConfig.created_by,
        updated_by: applicationConfig.created_by,
        is_active: true,
      },
    });

    additionalApplications.push(application);
  }

  await prisma.sub_loan.createMany({
    data: [
      {
        application_id: app1.application_id,
        customer_id: customer1.customer_id,
        applicant_type: 0,
        created_by: nirali.user_id,
        updated_by: nirali.user_id,
        is_active: true,
      },
      {
        application_id: app2.application_id,
        customer_id: customer2.customer_id,
        applicant_type: 0,
        created_by: miswa.user_id,
        updated_by: miswa.user_id,
        is_active: true,
      },
      {
        application_id: app3.application_id,
        customer_id: customer3.customer_id,
        applicant_type: 0,
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        application_id: app4.application_id,
        customer_id: customer4.customer_id,
        applicant_type: 0,
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        application_id: app4.application_id,
        customer_id: customer2.customer_id,
        applicant_type: 1,
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        application_id: app5.application_id,
        customer_id: customer1.customer_id,
        applicant_type: 0,
        created_by: sukh.user_id,
        updated_by: sukh.user_id,
        is_active: true,
      },
      ...additionalApplications.flatMap((application, index) => {
        const customer = additionalCustomers[index];
        const applicationConfig = additionalApplicationConfigs[index];

        if (!customer || !applicationConfig) {
          return [];
        }

        return [
          {
            application_id: application.application_id,
            customer_id: customer.customer_id,
            applicant_type: 0,
            created_by: applicationConfig.created_by,
            updated_by: applicationConfig.created_by,
            is_active: true,
          },
        ];
      }),
    ],
  });

  const app3SchedulesData = buildRepaymentSchedule(
    app3.application_id,
    50000,
    11.75,
    18,
    new Date('2026-04-01'),
    victor.user_id,
  );

  const app4SchedulesData = buildRepaymentSchedule(
    app4.application_id,
    125000,
    7.95,
    36,
    new Date('2026-03-15'),
    victor.user_id,
  );

  await prisma.repayment_schedule.createMany({
    data: [...app3SchedulesData, ...app4SchedulesData],
  });

  const app3Schedules = await prisma.repayment_schedule.findMany({
    where: { application_id: app3.application_id },
    orderBy: { installment_number: 'asc' },
  });

  const app4Schedules = await prisma.repayment_schedule.findMany({
    where: { application_id: app4.application_id },
    orderBy: { installment_number: 'asc' },
  });

  if (app3Schedules.length >= 2) {
    await prisma.loan_payment.create({
      data: {
        application_id: app3.application_id,
        schedule_id: app3Schedules[0].schedule_id,
        payment_reference: 'PAY-CP-2026-0003-01',
        payment_date: new Date('2026-05-01T10:30:00Z'),
        payment_amount: app3Schedules[0].installment_amount,
        payment_method: 'BANK_TRANSFER',
        payment_status: 'SUCCESS',
        transaction_id: 'TXN-APP3-001',
        remarks: 'First installment paid successfully',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
    });

    await prisma.repayment_schedule.update({
      where: { schedule_id: app3Schedules[0].schedule_id },
      data: {
        paid_amount: app3Schedules[0].installment_amount,
        payment_status: 'PAID',
        paid_date: new Date('2026-05-01T10:30:00Z'),
        updated_by: victor.user_id,
      },
    });

    await prisma.loan_payment.create({
      data: {
        application_id: app3.application_id,
        schedule_id: app3Schedules[1].schedule_id,
        payment_reference: 'PAY-CP-2026-0003-02',
        payment_date: new Date('2026-06-01T11:00:00Z'),
        payment_amount: app3Schedules[1].installment_amount,
        payment_method: 'BANK_TRANSFER',
        payment_status: 'SUCCESS',
        transaction_id: 'TXN-APP3-002',
        remarks: 'Second installment paid successfully',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
    });

    await prisma.repayment_schedule.update({
      where: { schedule_id: app3Schedules[1].schedule_id },
      data: {
        paid_amount: app3Schedules[1].installment_amount,
        payment_status: 'PAID',
        paid_date: new Date('2026-06-01T11:00:00Z'),
        updated_by: victor.user_id,
      },
    });
  }

  if (app4Schedules.length >= 1) {
    await prisma.loan_payment.create({
      data: {
        application_id: app4.application_id,
        schedule_id: app4Schedules[0].schedule_id,
        payment_reference: 'PAY-CP-2026-0004-01',
        payment_date: new Date('2026-04-15T09:15:00Z'),
        payment_amount: app4Schedules[0].installment_amount,
        payment_method: 'PRE_AUTH_DEBIT',
        payment_status: 'SUCCESS',
        transaction_id: 'TXN-APP4-001',
        remarks: 'Mortgage first installment',
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
    });

    await prisma.repayment_schedule.update({
      where: { schedule_id: app4Schedules[0].schedule_id },
      data: {
        paid_amount: app4Schedules[0].installment_amount,
        payment_status: 'PAID',
        paid_date: new Date('2026-04-15T09:15:00Z'),
        updated_by: victor.user_id,
      },
    });
  }

  const cibilApplicationTargets = [
    additionalApplications[0],
    additionalApplications[1],
    additionalApplications[2],
    additionalApplications[3],
    additionalApplications[4],
    additionalApplications[5],
    additionalApplications[6],
    additionalApplications[7],
    additionalApplications[8],
    additionalApplications[9],
  ];

  const cibilSeedData = [
    {
      request_id: 'REQ-20260323-001',
      reference_id: 'CIBIL-789456123',
      report_date: new Date('2026-03-23T14:30:00Z'),
      status: 'SUCCESS',
      cibil_score: 742,
      score_band: '700-749',
      risk_level: 'LOW',
      score_version: 'CIBIL 2.0',
      total_accounts: 5,
      active_accounts: 3,
      closed_accounts: 2,
      total_outstanding_balance: '185000.00',
      secured_loan_accounts: 2,
      unsecured_loan_accounts: 3,
      total_missed_payments: 1,
      recent_delinquency: false,
      credit_utilization_ratio: '0.15',
      average_account_age_years: '3.20',
      debt_to_income_estimate: '0.28',
      applicant: {
        first_name: 'Nirali',
        last_name: 'Patel',
        date_of_birth: new Date('2000-05-12'),
        sin_number: 'ABCDE1234F',
        mobile_number: '9876543210',
      },
      accounts: [
        {
          account_type: 'PERSONAL_LOAN',
          lender_name: 'HDFC Bank',
          account_number_masked: 'XXXXXX1234',
          ownership_type: 'INDIVIDUAL',
          open_date: new Date('2022-06-15'),
          current_balance: '75000.00',
          credit_limit: null,
          payment_status: 'CURRENT',
          days_past_due: 0,
        },
        {
          account_type: 'CREDIT_CARD',
          lender_name: 'ICICI Bank',
          account_number_masked: 'XXXXXX5678',
          ownership_type: 'INDIVIDUAL',
          open_date: new Date('2021-01-10'),
          current_balance: '15000.00',
          credit_limit: '100000.00',
          payment_status: 'CURRENT',
          days_past_due: 0,
        },
      ],
      paymentHistoryStatuses: [
        '000',
        '000',
        '000',
        '030',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
      ],
      enquiries: [
        {
          enquiry_date: new Date('2026-02-10'),
          institution: 'Axis Bank',
          enquiry_type: 'LOAN_ENQUIRY',
        },
        {
          enquiry_date: new Date('2025-12-05'),
          institution: 'SBI',
          enquiry_type: 'CREDIT_CARD_ENQUIRY',
        },
      ],
      riskIndicators: {
        high_credit_utilization: false,
        recent_hard_enquiries: true,
        thin_file: false,
        credit_mix_healthy: true,
      },
    },
    {
      request_id: 'REQ-20260323-002',
      reference_id: 'CIBIL-789456124',
      report_date: new Date('2026-03-22T10:15:00Z'),
      status: 'SUCCESS',
      cibil_score: 801,
      score_band: '800-850',
      risk_level: 'VERY_LOW',
      score_version: 'CIBIL 2.0',
      total_accounts: 4,
      active_accounts: 2,
      closed_accounts: 2,
      total_outstanding_balance: '95000.00',
      secured_loan_accounts: 1,
      unsecured_loan_accounts: 3,
      total_missed_payments: 0,
      recent_delinquency: false,
      credit_utilization_ratio: '0.11',
      average_account_age_years: '4.80',
      debt_to_income_estimate: '0.21',
      applicant: {
        first_name: 'Sukhpreet',
        last_name: 'Singh',
        date_of_birth: new Date('1998-09-21'),
        sin_number: 'BCDEF2345G',
        mobile_number: '9876543211',
      },
      accounts: [
        {
          account_type: 'AUTO_LOAN',
          lender_name: 'SBI',
          account_number_masked: 'XXXXXX1111',
          ownership_type: 'INDIVIDUAL',
          open_date: new Date('2023-04-11'),
          current_balance: '55000.00',
          credit_limit: null,
          payment_status: 'CURRENT',
          days_past_due: 0,
        },
        {
          account_type: 'CREDIT_CARD',
          lender_name: 'Axis Bank',
          account_number_masked: 'XXXXXX1112',
          ownership_type: 'INDIVIDUAL',
          open_date: new Date('2020-09-05'),
          current_balance: '12000.00',
          credit_limit: '150000.00',
          payment_status: 'CURRENT',
          days_past_due: 0,
        },
      ],
      paymentHistoryStatuses: [
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
      ],
      enquiries: [
        {
          enquiry_date: new Date('2026-01-15'),
          institution: 'HDFC Bank',
          enquiry_type: 'AUTO_LOAN_ENQUIRY',
        },
        {
          enquiry_date: new Date('2025-11-28'),
          institution: 'ICICI Bank',
          enquiry_type: 'CREDIT_CARD_ENQUIRY',
        },
      ],
      riskIndicators: {
        high_credit_utilization: false,
        recent_hard_enquiries: false,
        thin_file: false,
        credit_mix_healthy: true,
      },
    },
    {
      request_id: 'REQ-20260323-003',
      reference_id: 'CIBIL-789456125',
      report_date: new Date('2026-03-21T09:45:00Z'),
      status: 'SUCCESS',
      cibil_score: 688,
      score_band: '650-699',
      risk_level: 'MEDIUM',
      score_version: 'CIBIL 2.0',
      total_accounts: 6,
      active_accounts: 4,
      closed_accounts: 2,
      total_outstanding_balance: '245000.00',
      secured_loan_accounts: 3,
      unsecured_loan_accounts: 3,
      total_missed_payments: 2,
      recent_delinquency: true,
      credit_utilization_ratio: '0.38',
      average_account_age_years: '2.90',
      debt_to_income_estimate: '0.41',
      applicant: {
        first_name: 'Victor',
        last_name: 'Dsouza',
        date_of_birth: new Date('1995-11-03'),
        sin_number: 'CDEFG3456H',
        mobile_number: '9876543212',
      },
      accounts: [
        {
          account_type: 'HOME_LOAN',
          lender_name: 'LIC Housing',
          account_number_masked: 'XXXXXX2221',
          ownership_type: 'INDIVIDUAL',
          open_date: new Date('2021-08-19'),
          current_balance: '185000.00',
          credit_limit: null,
          payment_status: 'CURRENT',
          days_past_due: 0,
        },
        {
          account_type: 'CREDIT_CARD',
          lender_name: 'HDFC Bank',
          account_number_masked: 'XXXXXX2222',
          ownership_type: 'INDIVIDUAL',
          open_date: new Date('2019-03-14'),
          current_balance: '22000.00',
          credit_limit: '90000.00',
          payment_status: 'CURRENT',
          days_past_due: 30,
        },
      ],
      paymentHistoryStatuses: [
        '000',
        '030',
        '000',
        '000',
        '060',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
      ],
      enquiries: [
        {
          enquiry_date: new Date('2026-02-20'),
          institution: 'Kotak Mahindra Bank',
          enquiry_type: 'HOME_LOAN_ENQUIRY',
        },
        {
          enquiry_date: new Date('2025-10-14'),
          institution: 'Axis Bank',
          enquiry_type: 'CREDIT_CARD_ENQUIRY',
        },
      ],
      riskIndicators: {
        high_credit_utilization: true,
        recent_hard_enquiries: true,
        thin_file: false,
        credit_mix_healthy: true,
      },
    },
    {
      request_id: 'REQ-20260323-004',
      reference_id: 'CIBIL-789456126',
      report_date: new Date('2026-03-20T16:10:00Z'),
      status: 'SUCCESS',
      cibil_score: 615,
      score_band: '600-649',
      risk_level: 'HIGH',
      score_version: 'CIBIL 2.0',
      total_accounts: 7,
      active_accounts: 5,
      closed_accounts: 2,
      total_outstanding_balance: '410000.00',
      secured_loan_accounts: 4,
      unsecured_loan_accounts: 3,
      total_missed_payments: 4,
      recent_delinquency: true,
      credit_utilization_ratio: '0.62',
      average_account_age_years: '1.70',
      debt_to_income_estimate: '0.58',
      applicant: {
        first_name: 'Miswa',
        last_name: 'Ahmed',
        date_of_birth: new Date('1997-02-18'),
        sin_number: 'DEFGH4567I',
        mobile_number: '9876543213',
      },
      accounts: [
        {
          account_type: 'PERSONAL_LOAN',
          lender_name: 'Kotak Mahindra Bank',
          account_number_masked: 'XXXXXX3331',
          ownership_type: 'INDIVIDUAL',
          open_date: new Date('2024-02-09'),
          current_balance: '98000.00',
          credit_limit: null,
          payment_status: 'DELINQUENT',
          days_past_due: 60,
        },
        {
          account_type: 'CREDIT_CARD',
          lender_name: 'RBL Bank',
          account_number_masked: 'XXXXXX3332',
          ownership_type: 'INDIVIDUAL',
          open_date: new Date('2022-05-27'),
          current_balance: '34000.00',
          credit_limit: '60000.00',
          payment_status: 'DELINQUENT',
          days_past_due: 30,
        },
      ],
      paymentHistoryStatuses: [
        '000',
        '030',
        '000',
        '060',
        '000',
        '030',
        '000',
        '000',
        '000',
        '000',
        '060',
        '030',
      ],
      enquiries: [
        {
          enquiry_date: new Date('2026-03-01'),
          institution: 'RBL Bank',
          enquiry_type: 'PERSONAL_LOAN_ENQUIRY',
        },
        {
          enquiry_date: new Date('2026-01-09'),
          institution: 'Yes Bank',
          enquiry_type: 'CREDIT_CARD_ENQUIRY',
        },
      ],
      riskIndicators: {
        high_credit_utilization: true,
        recent_hard_enquiries: true,
        thin_file: false,
        credit_mix_healthy: false,
      },
    },
    {
      request_id: 'REQ-20260323-005',
      reference_id: 'CIBIL-789456127',
      report_date: new Date('2026-03-19T11:20:00Z'),
      status: 'SUCCESS',
      cibil_score: 770,
      score_band: '750-799',
      risk_level: 'VERY_LOW',
      score_version: 'CIBIL 2.0',
      total_accounts: 3,
      active_accounts: 1,
      closed_accounts: 2,
      total_outstanding_balance: '65000.00',
      secured_loan_accounts: 1,
      unsecured_loan_accounts: 2,
      total_missed_payments: 0,
      recent_delinquency: false,
      credit_utilization_ratio: '0.09',
      average_account_age_years: '5.40',
      debt_to_income_estimate: '0.18',
      applicant: {
        first_name: 'Aarav',
        last_name: 'Sharma',
        date_of_birth: new Date('1999-07-07'),
        sin_number: 'EFGHI5678J',
        mobile_number: '9876543214',
      },
      accounts: [
        {
          account_type: 'EDUCATION_LOAN',
          lender_name: 'Bank of Baroda',
          account_number_masked: 'XXXXXX4441',
          ownership_type: 'INDIVIDUAL',
          open_date: new Date('2018-07-01'),
          current_balance: '25000.00',
          credit_limit: null,
          payment_status: 'CURRENT',
          days_past_due: 0,
        },
        {
          account_type: 'CREDIT_CARD',
          lender_name: 'American Express',
          account_number_masked: 'XXXXXX4442',
          ownership_type: 'INDIVIDUAL',
          open_date: new Date('2019-12-18'),
          current_balance: '8000.00',
          credit_limit: '120000.00',
          payment_status: 'CURRENT',
          days_past_due: 0,
        },
      ],
      paymentHistoryStatuses: [
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
      ],
      enquiries: [
        {
          enquiry_date: new Date('2025-12-11'),
          institution: 'Bank of Baroda',
          enquiry_type: 'EDUCATION_LOAN_ENQUIRY',
        },
        {
          enquiry_date: new Date('2025-09-07'),
          institution: 'American Express',
          enquiry_type: 'CREDIT_CARD_ENQUIRY',
        },
      ],
      riskIndicators: {
        high_credit_utilization: false,
        recent_hard_enquiries: false,
        thin_file: false,
        credit_mix_healthy: true,
      },
    },
    {
      request_id: 'REQ-20260323-006',
      reference_id: 'CIBIL-789456128',
      report_date: new Date('2026-03-18T13:55:00Z'),
      status: 'SUCCESS',
      cibil_score: 702,
      score_band: '700-749',
      risk_level: 'LOW',
      score_version: 'CIBIL 2.0',
      total_accounts: 5,
      active_accounts: 3,
      closed_accounts: 2,
      total_outstanding_balance: '150000.00',
      secured_loan_accounts: 2,
      unsecured_loan_accounts: 3,
      total_missed_payments: 1,
      recent_delinquency: false,
      credit_utilization_ratio: '0.22',
      average_account_age_years: '3.60',
      debt_to_income_estimate: '0.31',
      applicant: {
        first_name: 'Priya',
        last_name: 'Mehta',
        date_of_birth: new Date('1996-04-25'),
        sin_number: 'FGHIJ6789K',
        mobile_number: '9876543215',
      },
      accounts: [
        {
          account_type: 'PERSONAL_LOAN',
          lender_name: 'IndusInd Bank',
          account_number_masked: 'XXXXXX5551',
          ownership_type: 'INDIVIDUAL',
          open_date: new Date('2023-01-22'),
          current_balance: '68000.00',
          credit_limit: null,
          payment_status: 'CURRENT',
          days_past_due: 0,
        },
        {
          account_type: 'CREDIT_CARD',
          lender_name: 'ICICI Bank',
          account_number_masked: 'XXXXXX5552',
          ownership_type: 'INDIVIDUAL',
          open_date: new Date('2020-06-03'),
          current_balance: '18000.00',
          credit_limit: '85000.00',
          payment_status: 'CURRENT',
          days_past_due: 0,
        },
      ],
      paymentHistoryStatuses: [
        '000',
        '000',
        '030',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
      ],
      enquiries: [
        {
          enquiry_date: new Date('2026-02-12'),
          institution: 'IndusInd Bank',
          enquiry_type: 'PERSONAL_LOAN_ENQUIRY',
        },
        {
          enquiry_date: new Date('2025-12-29'),
          institution: 'ICICI Bank',
          enquiry_type: 'CREDIT_CARD_ENQUIRY',
        },
      ],
      riskIndicators: {
        high_credit_utilization: false,
        recent_hard_enquiries: true,
        thin_file: false,
        credit_mix_healthy: true,
      },
    },
    {
      request_id: 'REQ-20260323-007',
      reference_id: 'CIBIL-789456129',
      report_date: new Date('2026-03-17T08:30:00Z'),
      status: 'SUCCESS',
      cibil_score: 590,
      score_band: '300-599',
      risk_level: 'VERY_HIGH',
      score_version: 'CIBIL 2.0',
      total_accounts: 8,
      active_accounts: 6,
      closed_accounts: 2,
      total_outstanding_balance: '520000.00',
      secured_loan_accounts: 5,
      unsecured_loan_accounts: 3,
      total_missed_payments: 6,
      recent_delinquency: true,
      credit_utilization_ratio: '0.79',
      average_account_age_years: '1.20',
      debt_to_income_estimate: '0.67',
      applicant: {
        first_name: 'Rohan',
        last_name: 'Gupta',
        date_of_birth: new Date('1994-12-14'),
        sin_number: 'GHIJK7890L',
        mobile_number: '9876543216',
      },
      accounts: [
        {
          account_type: 'BUSINESS_LOAN',
          lender_name: 'Yes Bank',
          account_number_masked: 'XXXXXX6661',
          ownership_type: 'INDIVIDUAL',
          open_date: new Date('2024-06-10'),
          current_balance: '210000.00',
          credit_limit: null,
          payment_status: 'DELINQUENT',
          days_past_due: 90,
        },
        {
          account_type: 'CREDIT_CARD',
          lender_name: 'Standard Chartered',
          account_number_masked: 'XXXXXX6662',
          ownership_type: 'INDIVIDUAL',
          open_date: new Date('2021-10-29'),
          current_balance: '49000.00',
          credit_limit: '65000.00',
          payment_status: 'DELINQUENT',
          days_past_due: 60,
        },
      ],
      paymentHistoryStatuses: [
        '120',
        '090',
        '060',
        '030',
        '000',
        '000',
        '000',
        '000',
        '030',
        '000',
        '060',
        '000',
      ],
      enquiries: [
        {
          enquiry_date: new Date('2026-03-05'),
          institution: 'Yes Bank',
          enquiry_type: 'BUSINESS_LOAN_ENQUIRY',
        },
        {
          enquiry_date: new Date('2026-02-02'),
          institution: 'Standard Chartered',
          enquiry_type: 'CREDIT_CARD_ENQUIRY',
        },
      ],
      riskIndicators: {
        high_credit_utilization: true,
        recent_hard_enquiries: true,
        thin_file: true,
        credit_mix_healthy: false,
      },
    },
    {
      request_id: 'REQ-20260323-008',
      reference_id: 'CIBIL-789456130',
      report_date: new Date('2026-03-16T15:40:00Z'),
      status: 'SUCCESS',
      cibil_score: 730,
      score_band: '700-749',
      risk_level: 'LOW',
      score_version: 'CIBIL 2.0',
      total_accounts: 4,
      active_accounts: 2,
      closed_accounts: 2,
      total_outstanding_balance: '110000.00',
      secured_loan_accounts: 1,
      unsecured_loan_accounts: 3,
      total_missed_payments: 0,
      recent_delinquency: false,
      credit_utilization_ratio: '0.17',
      average_account_age_years: '4.10',
      debt_to_income_estimate: '0.26',
      applicant: {
        first_name: 'Ananya',
        last_name: 'Iyer',
        date_of_birth: new Date('2001-01-30'),
        sin_number: 'HIJKL8901M',
        mobile_number: '9876543217',
      },
      accounts: [
        {
          account_type: 'AUTO_LOAN',
          lender_name: 'Canara Bank',
          account_number_masked: 'XXXXXX7771',
          ownership_type: 'INDIVIDUAL',
          open_date: new Date('2022-11-16'),
          current_balance: '52000.00',
          credit_limit: null,
          payment_status: 'CURRENT',
          days_past_due: 0,
        },
        {
          account_type: 'CREDIT_CARD',
          lender_name: 'HDFC Bank',
          account_number_masked: 'XXXXXX7772',
          ownership_type: 'INDIVIDUAL',
          open_date: new Date('2019-02-07'),
          current_balance: '9000.00',
          credit_limit: '70000.00',
          payment_status: 'CURRENT',
          days_past_due: 0,
        },
      ],
      paymentHistoryStatuses: [
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
      ],
      enquiries: [
        {
          enquiry_date: new Date('2025-11-19'),
          institution: 'Canara Bank',
          enquiry_type: 'AUTO_LOAN_ENQUIRY',
        },
        {
          enquiry_date: new Date('2025-08-23'),
          institution: 'HDFC Bank',
          enquiry_type: 'CREDIT_CARD_ENQUIRY',
        },
      ],
      riskIndicators: {
        high_credit_utilization: false,
        recent_hard_enquiries: false,
        thin_file: false,
        credit_mix_healthy: true,
      },
    },
    {
      request_id: 'REQ-20260323-009',
      reference_id: 'CIBIL-789456131',
      report_date: new Date('2026-03-15T12:05:00Z'),
      status: 'SUCCESS',
      cibil_score: 655,
      score_band: '650-699',
      risk_level: 'MEDIUM',
      score_version: 'CIBIL 2.0',
      total_accounts: 6,
      active_accounts: 4,
      closed_accounts: 2,
      total_outstanding_balance: '275000.00',
      secured_loan_accounts: 3,
      unsecured_loan_accounts: 3,
      total_missed_payments: 2,
      recent_delinquency: false,
      credit_utilization_ratio: '0.44',
      average_account_age_years: '2.40',
      debt_to_income_estimate: '0.47',
      applicant: {
        first_name: 'Karan',
        last_name: 'Malhotra',
        date_of_birth: new Date('1993-06-11'),
        sin_number: 'IJKLM9012N',
        mobile_number: '9876543218',
      },
      accounts: [
        {
          account_type: 'HOME_LOAN',
          lender_name: 'PNB Housing',
          account_number_masked: 'XXXXXX8881',
          ownership_type: 'INDIVIDUAL',
          open_date: new Date('2022-03-21'),
          current_balance: '205000.00',
          credit_limit: null,
          payment_status: 'CURRENT',
          days_past_due: 0,
        },
        {
          account_type: 'CREDIT_CARD',
          lender_name: 'SBI Card',
          account_number_masked: 'XXXXXX8882',
          ownership_type: 'INDIVIDUAL',
          open_date: new Date('2020-08-30'),
          current_balance: '26000.00',
          credit_limit: '80000.00',
          payment_status: 'CURRENT',
          days_past_due: 60,
        },
      ],
      paymentHistoryStatuses: [
        '000',
        '000',
        '030',
        '000',
        '000',
        '000',
        '000',
        '000',
        '060',
        '000',
        '000',
        '000',
      ],
      enquiries: [
        {
          enquiry_date: new Date('2026-01-17'),
          institution: 'PNB Housing',
          enquiry_type: 'HOME_LOAN_ENQUIRY',
        },
        {
          enquiry_date: new Date('2025-11-01'),
          institution: 'SBI Card',
          enquiry_type: 'CREDIT_CARD_ENQUIRY',
        },
      ],
      riskIndicators: {
        high_credit_utilization: true,
        recent_hard_enquiries: true,
        thin_file: false,
        credit_mix_healthy: true,
      },
    },
    {
      request_id: 'REQ-20260323-010',
      reference_id: 'CIBIL-789456132',
      report_date: new Date('2026-03-14T09:10:00Z'),
      status: 'SUCCESS',
      cibil_score: 845,
      score_band: '800-850',
      risk_level: 'VERY_LOW',
      score_version: 'CIBIL 2.0',
      total_accounts: 2,
      active_accounts: 1,
      closed_accounts: 1,
      total_outstanding_balance: '45000.00',
      secured_loan_accounts: 1,
      unsecured_loan_accounts: 1,
      total_missed_payments: 0,
      recent_delinquency: false,
      credit_utilization_ratio: '0.05',
      average_account_age_years: '6.80',
      debt_to_income_estimate: '0.12',
      applicant: {
        first_name: 'Diya',
        last_name: 'Kapoor',
        date_of_birth: new Date('1998-08-09'),
        sin_number: 'JKLMN0123P',
        mobile_number: '9876543219',
      },
      accounts: [
        {
          account_type: 'CREDIT_CARD',
          lender_name: 'ICICI Bank',
          account_number_masked: 'XXXXXX9991',
          ownership_type: 'INDIVIDUAL',
          open_date: new Date('2018-01-12'),
          current_balance: '5000.00',
          credit_limit: '100000.00',
          payment_status: 'CURRENT',
          days_past_due: 0,
        },
        {
          account_type: 'AUTO_LOAN',
          lender_name: 'HDFC Bank',
          account_number_masked: 'XXXXXX9992',
          ownership_type: 'INDIVIDUAL',
          open_date: new Date('2020-04-25'),
          current_balance: '16000.00',
          credit_limit: null,
          payment_status: 'CURRENT',
          days_past_due: 0,
        },
      ],
      paymentHistoryStatuses: [
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
        '000',
      ],
      enquiries: [
        {
          enquiry_date: new Date('2025-10-08'),
          institution: 'ICICI Bank',
          enquiry_type: 'CREDIT_CARD_ENQUIRY',
        },
        {
          enquiry_date: new Date('2025-07-12'),
          institution: 'HDFC Bank',
          enquiry_type: 'AUTO_LOAN_ENQUIRY',
        },
      ],
      riskIndicators: {
        high_credit_utilization: false,
        recent_hard_enquiries: false,
        thin_file: false,
        credit_mix_healthy: true,
      },
    },
  ];

  for (const [index, cibilSeed] of cibilSeedData.entries()) {
    const targetApplication = cibilApplicationTargets[index];

    if (!targetApplication) {
      continue;
    }

    const cibilReport = await prisma.cibil_reports.create({
      data: {
        application_id: targetApplication.application_id,
        request_id: cibilSeed.request_id,
        reference_id: cibilSeed.reference_id,
        bureau: 'CIBIL',
        report_date: cibilSeed.report_date,
        status: cibilSeed.status,
        cibil_score: cibilSeed.cibil_score,
        score_band: cibilSeed.score_band,
        risk_level: cibilSeed.risk_level,
        score_version: cibilSeed.score_version,
        total_accounts: cibilSeed.total_accounts,
        active_accounts: cibilSeed.active_accounts,
        closed_accounts: cibilSeed.closed_accounts,
        total_outstanding_balance: cibilSeed.total_outstanding_balance,
        secured_loan_accounts: cibilSeed.secured_loan_accounts,
        unsecured_loan_accounts: cibilSeed.unsecured_loan_accounts,
        total_missed_payments: cibilSeed.total_missed_payments,
        recent_delinquency: cibilSeed.recent_delinquency,
        credit_utilization_ratio: cibilSeed.credit_utilization_ratio,
        average_account_age_years: cibilSeed.average_account_age_years,
        debt_to_income_estimate: cibilSeed.debt_to_income_estimate,
      },
    });

    await prisma.cibil_applicants.create({
      data: {
        cibil_report_id: cibilReport.cibil_report_id,
        first_name: cibilSeed.applicant.first_name,
        last_name: cibilSeed.applicant.last_name,
        date_of_birth: cibilSeed.applicant.date_of_birth,
        sin_number: cibilSeed.applicant.sin_number,
        mobile_number: cibilSeed.applicant.mobile_number,
      },
    });

    await prisma.cibil_accounts.createMany({
      data: cibilSeed.accounts.map((account) => ({
        cibil_report_id: cibilReport.cibil_report_id,
        account_type: account.account_type,
        lender_name: account.lender_name,
        account_number_masked: account.account_number_masked,
        ownership_type: account.ownership_type,
        open_date: account.open_date,
        current_balance: account.current_balance,
        credit_limit: account.credit_limit,
        payment_status: account.payment_status,
        days_past_due: account.days_past_due,
      })),
    });

    await prisma.cibil_payment_history.createMany({
      data: cibilSeed.paymentHistoryStatuses.map((statusCode, historyIndex) => ({
        cibil_report_id: cibilReport.cibil_report_id,
        month_index: historyIndex + 1,
        status_code: statusCode,
      })),
    });

    await prisma.cibil_enquiries.createMany({
      data: cibilSeed.enquiries.map((enquiry) => ({
        cibil_report_id: cibilReport.cibil_report_id,
        enquiry_date: enquiry.enquiry_date,
        institution: enquiry.institution,
        enquiry_type: enquiry.enquiry_type,
      })),
    });

    await prisma.cibil_risk_indicators.create({
      data: {
        cibil_report_id: cibilReport.cibil_report_id,
        high_credit_utilization: cibilSeed.riskIndicators.high_credit_utilization,
        recent_hard_enquiries: cibilSeed.riskIndicators.recent_hard_enquiries,
        thin_file: cibilSeed.riskIndicators.thin_file,
        credit_mix_healthy: cibilSeed.riskIndicators.credit_mix_healthy,
      },
    });
  }

  await prisma.application_status_audit.createMany({
    data: [
      {
        application_number: 'APPL0000000001',
        dob_hash: '1997-02-14',
        success: true,
        reason_code: 'MATCH_FOUND',
        ip_address: '127.0.0.1',
        user_agent: 'Seed Script / Internal Test',
      },
      {
        application_number: 'APPL0000000002',
        dob_hash: '1995-11-03',
        success: true,
        reason_code: 'MATCH_FOUND',
        ip_address: '127.0.0.1',
        user_agent: 'Seed Script / Internal Test',
      },
      {
        application_number: 'APPL0000000999',
        dob_hash: '2001-01-01',
        success: false,
        reason_code: 'APPLICATION_NOT_FOUND',
        ip_address: '127.0.0.1',
        user_agent: 'Seed Script / Negative Test',
      },
    ],
  });

  console.log('Seed completed successfully.');
}

async function seedSupplemental() {
  console.log('Starting supplemental seed for previously uncovered tables...');

  const victor = await getRequiredUser('victor@creditpulse.com');
  const miswa = await getRequiredUser('miswa@creditpulse.com');
  const nirali = await getRequiredUser('nirali@creditpulse.com');
  const sukh = await getRequiredUser('sukh@creditpulse.com');

  const createdBy = victor.user_id;
  const updatedBy = victor.user_id;

  const male = await prisma.genders.upsert({
    where: { gender_code: 'MALE' },
    update: {
      gender_name: 'Male',
      updated_by: updatedBy,
      is_active: true,
    },
    create: {
      gender_code: 'MALE',
      gender_name: 'Male',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const female = await prisma.genders.upsert({
    where: { gender_code: 'FEMALE' },
    update: {
      gender_name: 'Female',
      updated_by: updatedBy,
      is_active: true,
    },
    create: {
      gender_code: 'FEMALE',
      gender_name: 'Female',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const otherGender = await prisma.genders.upsert({
    where: { gender_code: 'OTHER' },
    update: {
      gender_name: 'Other',
      updated_by: updatedBy,
      is_active: true,
    },
    create: {
      gender_code: 'OTHER',
      gender_name: 'Other',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const singleStatus = await prisma.marital_statuses.upsert({
    where: { marital_status_code: 'SINGLE' },
    update: {
      marital_status_name: 'Single',
      updated_by: updatedBy,
      is_active: true,
    },
    create: {
      marital_status_code: 'SINGLE',
      marital_status_name: 'Single',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const marriedStatus = await prisma.marital_statuses.upsert({
    where: { marital_status_code: 'MARRIED' },
    update: {
      marital_status_name: 'Married',
      updated_by: updatedBy,
      is_active: true,
    },
    create: {
      marital_status_code: 'MARRIED',
      marital_status_name: 'Married',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const divorcedStatus = await prisma.marital_statuses.upsert({
    where: { marital_status_code: 'DIVORCED' },
    update: {
      marital_status_name: 'Divorced',
      updated_by: updatedBy,
      is_active: true,
    },
    create: {
      marital_status_code: 'DIVORCED',
      marital_status_name: 'Divorced',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const canada = await prisma.countries.upsert({
    where: { country_code: 'CAN' },
    update: {
      country_name: 'Canada',
      nationality_name: 'Canadian',
      updated_by: updatedBy,
      is_active: true,
    },
    create: {
      country_code: 'CAN',
      country_name: 'Canada',
      nationality_name: 'Canadian',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const india = await prisma.countries.upsert({
    where: { country_code: 'IND' },
    update: {
      country_name: 'India',
      nationality_name: 'Indian',
      updated_by: updatedBy,
      is_active: true,
    },
    create: {
      country_code: 'IND',
      country_name: 'India',
      nationality_name: 'Indian',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const usa = await prisma.countries.upsert({
    where: { country_code: 'USA' },
    update: {
      country_name: 'United States',
      nationality_name: 'American',
      updated_by: updatedBy,
      is_active: true,
    },
    create: {
      country_code: 'USA',
      country_name: 'United States',
      nationality_name: 'American',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const sinType = await prisma.government_id_types.upsert({
    where: { government_id_type_code: 'SIN' },
    update: {
      government_id_type_name: 'Social Insurance Number',
      updated_by: updatedBy,
      is_active: true,
    },
    create: {
      government_id_type_code: 'SIN',
      government_id_type_name: 'Social Insurance Number',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const passportType = await prisma.government_id_types.upsert({
    where: { government_id_type_code: 'PASSPORT' },
    update: {
      government_id_type_name: 'Passport',
      updated_by: updatedBy,
      is_active: true,
    },
    create: {
      government_id_type_code: 'PASSPORT',
      government_id_type_name: 'Passport',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const drivingLicenceType = await prisma.government_id_types.upsert({
    where: { government_id_type_code: 'DRIVING_LICENSE' },
    update: {
      government_id_type_name: 'Driving License',
      updated_by: updatedBy,
      is_active: true,
    },
    create: {
      government_id_type_code: 'DRIVING_LICENSE',
      government_id_type_name: 'Driving License',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const mobileContactType = await prisma.contact_types.upsert({
    where: { contact_type_code: 'MOBILE' },
    update: {
      contact_type_name: 'Mobile Number',
      updated_by: updatedBy,
      is_active: true,
    },
    create: {
      contact_type_code: 'MOBILE',
      contact_type_name: 'Mobile Number',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const emailContactType = await prisma.contact_types.upsert({
    where: { contact_type_code: 'EMAIL' },
    update: {
      contact_type_name: 'Email Address',
      updated_by: updatedBy,
      is_active: true,
    },
    create: {
      contact_type_code: 'EMAIL',
      contact_type_name: 'Email Address',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const workPhoneContactType = await prisma.contact_types.upsert({
    where: { contact_type_code: 'WORK_PHONE' },
    update: {
      contact_type_name: 'Work Phone',
      updated_by: updatedBy,
      is_active: true,
    },
    create: {
      contact_type_code: 'WORK_PHONE',
      contact_type_name: 'Work Phone',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const salaryIncomeType = await prisma.income_source_types.upsert({
    where: { income_source_type_code: 'SALARY' },
    update: {
      income_source_type_name: 'Salary',
      updated_by: updatedBy,
      is_active: true,
    },
    create: {
      income_source_type_code: 'SALARY',
      income_source_type_name: 'Salary',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const businessIncomeType = await prisma.income_source_types.upsert({
    where: { income_source_type_code: 'BUSINESS' },
    update: {
      income_source_type_name: 'Business Income',
      updated_by: updatedBy,
      is_active: true,
    },
    create: {
      income_source_type_code: 'BUSINESS',
      income_source_type_name: 'Business Income',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const rentalIncomeType = await prisma.income_source_types.upsert({
    where: { income_source_type_code: 'RENTAL' },
    update: {
      income_source_type_name: 'Rental Income',
      updated_by: updatedBy,
      is_active: true,
    },
    create: {
      income_source_type_code: 'RENTAL',
      income_source_type_name: 'Rental Income',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const freelanceIncomeType = await prisma.income_source_types.upsert({
    where: { income_source_type_code: 'FREELANCE' },
    update: {
      income_source_type_name: 'Freelance Income',
      updated_by: updatedBy,
      is_active: true,
    },
    create: {
      income_source_type_code: 'FREELANCE',
      income_source_type_name: 'Freelance Income',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const pensionIncomeType = await prisma.income_source_types.upsert({
    where: { income_source_type_code: 'PENSION' },
    update: {
      income_source_type_name: 'Pension Income',
      updated_by: updatedBy,
      is_active: true,
    },
    create: {
      income_source_type_code: 'PENSION',
      income_source_type_name: 'Pension Income',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const personalLoanLiabilityType = await prisma.liability_types.upsert({
    where: { liability_type_code: 'PERSONAL_LOAN' },
    update: {
      liability_type_name: 'Personal Loan',
      updated_by: updatedBy,
      is_active: true,
    },
    create: {
      liability_type_code: 'PERSONAL_LOAN',
      liability_type_name: 'Personal Loan',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const creditCardLiabilityType = await prisma.liability_types.upsert({
    where: { liability_type_code: 'CREDIT_CARD' },
    update: {
      liability_type_name: 'Credit Card',
      updated_by: updatedBy,
      is_active: true,
    },
    create: {
      liability_type_code: 'CREDIT_CARD',
      liability_type_name: 'Credit Card',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const autoLoanLiabilityType = await prisma.liability_types.upsert({
    where: { liability_type_code: 'AUTO_LOAN' },
    update: {
      liability_type_name: 'Auto Loan',
      updated_by: updatedBy,
      is_active: true,
    },
    create: {
      liability_type_code: 'AUTO_LOAN',
      liability_type_name: 'Auto Loan',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const homeLoanLiabilityType = await prisma.liability_types.upsert({
    where: { liability_type_code: 'HOME_LOAN' },
    update: {
      liability_type_name: 'Home Loan',
      updated_by: updatedBy,
      is_active: true,
    },
    create: {
      liability_type_code: 'HOME_LOAN',
      liability_type_name: 'Home Loan',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const chequingAccountType = await prisma.bank_account_types.upsert({
    where: { account_type_code: 'CHEQUING' },
    update: {
      account_type_name: 'Chequing Account',
      updated_by: updatedBy,
      is_active: true,
    },
    create: {
      account_type_code: 'CHEQUING',
      account_type_name: 'Chequing Account',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const savingsAccountType = await prisma.bank_account_types.upsert({
    where: { account_type_code: 'SAVINGS' },
    update: {
      account_type_name: 'Savings Account',
      updated_by: updatedBy,
      is_active: true,
    },
    create: {
      account_type_code: 'SAVINGS',
      account_type_name: 'Savings Account',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const currentAccountType = await prisma.bank_account_types.upsert({
    where: { account_type_code: 'CURRENT' },
    update: {
      account_type_name: 'Current Account',
      updated_by: updatedBy,
      is_active: true,
    },
    create: {
      account_type_code: 'CURRENT',
      account_type_name: 'Current Account',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const governmentIdDocumentType = await prisma.document_types.upsert({
    where: { document_type_code: 'GOVERNMENT_ID' },
    update: {
      document_type_name: 'Government ID',
      updated_by: updatedBy,
      is_active: true,
    },
    create: {
      document_type_code: 'GOVERNMENT_ID',
      document_type_name: 'Government ID',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const payslipDocumentType = await prisma.document_types.upsert({
    where: { document_type_code: 'PAYSLIP' },
    update: {
      document_type_name: 'Payslip',
      updated_by: updatedBy,
      is_active: true,
    },
    create: {
      document_type_code: 'PAYSLIP',
      document_type_name: 'Payslip',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const bankStatementDocumentType = await prisma.document_types.upsert({
    where: { document_type_code: 'BANK_STATEMENT' },
    update: {
      document_type_name: 'Bank Statement',
      updated_by: updatedBy,
      is_active: true,
    },
    create: {
      document_type_code: 'BANK_STATEMENT',
      document_type_name: 'Bank Statement',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const addressProofDocumentType = await prisma.document_types.upsert({
    where: { document_type_code: 'ADDRESS_PROOF' },
    update: {
      document_type_name: 'Address Proof',
      updated_by: updatedBy,
      is_active: true,
    },
    create: {
      document_type_code: 'ADDRESS_PROOF',
      document_type_name: 'Address Proof',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  });

  const homeAddressType = await findOrCreateAddressType(
    'HOME',
    'Home Address',
    createdBy,
    updatedBy,
  );
  const workAddressType = await findOrCreateAddressType(
    'WORK',
    'Work Address',
    createdBy,
    updatedBy,
  );
  const fullTimeEmployment = await findOrCreateEmploymentType(
    'FULL_TIME',
    'Full Time',
    createdBy,
    updatedBy,
  );
  const partTimeEmployment = await findOrCreateEmploymentType(
    'PART_TIME',
    'Part Time',
    createdBy,
    updatedBy,
  );
  const bachelorsEducation = await findOrCreateEducationLevel(
    'BACHELORS',
    'Bachelors',
    createdBy,
    updatedBy,
  );
  const mastersEducation = await findOrCreateEducationLevel(
    'MASTERS',
    'Masters',
    createdBy,
    updatedBy,
  );
  const conestoga = await findOrCreateInstitution(
    'Conestoga College',
    'Kitchener',
    'Canada',
    createdBy,
    updatedBy,
  );
  const uoft = await findOrCreateInstitution(
    'University of Toronto',
    'Toronto',
    'Canada',
    createdBy,
    updatedBy,
  );
  const mcmaster = await findOrCreateInstitution(
    'McMaster University',
    'Hamilton',
    'Canada',
    createdBy,
    updatedBy,
  );
  const rbc = await findOrCreateBank('RBC', 'Royal Bank of Canada', createdBy, updatedBy);
  const td = await findOrCreateBank('TD', 'Toronto-Dominion Bank', createdBy, updatedBy);
  const cibc = await findOrCreateBank(
    'CIBC',
    'Canadian Imperial Bank of Commerce',
    createdBy,
    updatedBy,
  );

  const amanSharma = await getRequiredCustomer('Aman', 'Sharma', '1997-02-14');
  const priyaVerma = await getRequiredCustomer('Priya', 'Verma', '1995-11-03');
  const rahulSingh = await getRequiredCustomer('Rahul', 'Singh', '1992-07-28');
  const simranKaur = await getRequiredCustomer('Simran', 'Kaur', '2000-05-19');
  const amanJoshi = await getRequiredCustomer('Aman', 'Joshi', '1991-03-14');
  const nehaShah = await getRequiredCustomer('Neha', 'Shah', '1997-09-08');
  const devPatel = await getRequiredCustomer('Dev', 'Patel', '1990-12-22');
  const ishaNair = await getRequiredCustomer('Isha', 'Nair', '1998-04-17');

  const targetCustomers = [
    amanSharma,
    priyaVerma,
    rahulSingh,
    simranKaur,
    amanJoshi,
    nehaShah,
    devPatel,
    ishaNair,
  ];

  const targetCustomerIds = targetCustomers.map((customer) => customer.customer_id);

  const customerProfileUpdates = [
    {
      customerId: amanSharma.customer_id,
      genderId: male.gender_id,
      maritalStatusId: marriedStatus.marital_status_id,
      nationalityCountryId: india.country_id,
      sinTaxId: 'SIN00001001',
      updatedBy: nirali.user_id,
    },
    {
      customerId: priyaVerma.customer_id,
      genderId: female.gender_id,
      maritalStatusId: singleStatus.marital_status_id,
      nationalityCountryId: india.country_id,
      sinTaxId: 'SIN00001002',
      updatedBy: sukh.user_id,
    },
    {
      customerId: rahulSingh.customer_id,
      genderId: male.gender_id,
      maritalStatusId: marriedStatus.marital_status_id,
      nationalityCountryId: india.country_id,
      sinTaxId: 'SIN00001003',
      updatedBy: miswa.user_id,
    },
    {
      customerId: simranKaur.customer_id,
      genderId: female.gender_id,
      maritalStatusId: singleStatus.marital_status_id,
      nationalityCountryId: canada.country_id,
      sinTaxId: 'SIN00001004',
      updatedBy: nirali.user_id,
    },
    {
      customerId: amanJoshi.customer_id,
      genderId: male.gender_id,
      maritalStatusId: marriedStatus.marital_status_id,
      nationalityCountryId: canada.country_id,
      sinTaxId: 'SIN00001005',
      updatedBy: sukh.user_id,
    },
    {
      customerId: nehaShah.customer_id,
      genderId: female.gender_id,
      maritalStatusId: singleStatus.marital_status_id,
      nationalityCountryId: india.country_id,
      sinTaxId: 'SIN00001006',
      updatedBy: nirali.user_id,
    },
    {
      customerId: devPatel.customer_id,
      genderId: male.gender_id,
      maritalStatusId: marriedStatus.marital_status_id,
      nationalityCountryId: usa.country_id,
      sinTaxId: 'SIN00001007',
      updatedBy: victor.user_id,
    },
    {
      customerId: ishaNair.customer_id,
      genderId: otherGender.gender_id,
      maritalStatusId: divorcedStatus.marital_status_id,
      nationalityCountryId: india.country_id,
      sinTaxId: 'SIN00001008',
      updatedBy: miswa.user_id,
    },
  ];

  for (const profileUpdate of customerProfileUpdates) {
    await prisma.customer.update({
      where: { customer_id: profileUpdate.customerId },
      data: {
        gender_id: profileUpdate.genderId,
        marital_status_id: profileUpdate.maritalStatusId,
        nationality_country_id: profileUpdate.nationalityCountryId,
        sin_tax_id_masked: maskValue(profileUpdate.sinTaxId),
        sin_tax_id_encrypted: Buffer.from(profileUpdate.sinTaxId, 'utf8'),
        updated_by: profileUpdate.updatedBy,
      },
    });
  }

  await prisma.customer_document_details.deleteMany({
    where: { customer_id: { in: targetCustomerIds } },
  });

  await prisma.customer_bank_details.deleteMany({
    where: { customer_id: { in: targetCustomerIds } },
  });

  await prisma.customer_government_id.deleteMany({
    where: { customer_id: { in: targetCustomerIds } },
  });

  await prisma.customer_liabilities.deleteMany({
    where: { customer_id: { in: targetCustomerIds } },
  });

  await prisma.customer_income_sources.deleteMany({
    where: { customer_id: { in: targetCustomerIds } },
  });

  await prisma.customer_employment_details.deleteMany({
    where: { customer_id: { in: targetCustomerIds } },
  });

  await prisma.customer_education_details.deleteMany({
    where: { customer_id: { in: targetCustomerIds } },
  });

  await prisma.customer_address_details.deleteMany({
    where: { customer_id: { in: targetCustomerIds } },
  });

  await prisma.customer_contact_details.deleteMany({
    where: { customer_id: { in: targetCustomerIds } },
  });

  await prisma.customer_contact_details.createMany({
    data: [
      {
        customer_id: amanSharma.customer_id,
        contact_type_id: mobileContactType.contact_type_id,
        contact_value: '+1-519-555-2001',
        is_primary: true,
        is_verified: true,
        created_by: nirali.user_id,
        updated_by: nirali.user_id,
        is_active: true,
      },
      {
        customer_id: amanSharma.customer_id,
        contact_type_id: emailContactType.contact_type_id,
        contact_value: 'aman.sharma@demo.creditpulse.com',
        is_primary: false,
        is_verified: true,
        created_by: nirali.user_id,
        updated_by: nirali.user_id,
        is_active: true,
      },
      {
        customer_id: priyaVerma.customer_id,
        contact_type_id: mobileContactType.contact_type_id,
        contact_value: '+1-519-555-2002',
        is_primary: true,
        is_verified: true,
        created_by: sukh.user_id,
        updated_by: sukh.user_id,
        is_active: true,
      },
      {
        customer_id: priyaVerma.customer_id,
        contact_type_id: emailContactType.contact_type_id,
        contact_value: 'priya.verma@demo.creditpulse.com',
        is_primary: false,
        is_verified: true,
        created_by: sukh.user_id,
        updated_by: sukh.user_id,
        is_active: true,
      },
      {
        customer_id: rahulSingh.customer_id,
        contact_type_id: mobileContactType.contact_type_id,
        contact_value: '+1-519-555-2003',
        is_primary: true,
        is_verified: true,
        created_by: miswa.user_id,
        updated_by: miswa.user_id,
        is_active: true,
      },
      {
        customer_id: rahulSingh.customer_id,
        contact_type_id: workPhoneContactType.contact_type_id,
        contact_value: '+1-519-555-3003',
        is_primary: false,
        is_verified: false,
        created_by: miswa.user_id,
        updated_by: miswa.user_id,
        is_active: true,
      },
      {
        customer_id: simranKaur.customer_id,
        contact_type_id: mobileContactType.contact_type_id,
        contact_value: '+1-519-555-2004',
        is_primary: true,
        is_verified: true,
        created_by: nirali.user_id,
        updated_by: nirali.user_id,
        is_active: true,
      },
      {
        customer_id: simranKaur.customer_id,
        contact_type_id: emailContactType.contact_type_id,
        contact_value: 'simran.kaur@demo.creditpulse.com',
        is_primary: false,
        is_verified: true,
        created_by: nirali.user_id,
        updated_by: nirali.user_id,
        is_active: true,
      },
      {
        customer_id: amanJoshi.customer_id,
        contact_type_id: mobileContactType.contact_type_id,
        contact_value: '+1-519-555-2005',
        is_primary: true,
        is_verified: true,
        created_by: sukh.user_id,
        updated_by: sukh.user_id,
        is_active: true,
      },
      {
        customer_id: amanJoshi.customer_id,
        contact_type_id: emailContactType.contact_type_id,
        contact_value: 'aman.joshi@demo.creditpulse.com',
        is_primary: false,
        is_verified: true,
        created_by: sukh.user_id,
        updated_by: sukh.user_id,
        is_active: true,
      },
      {
        customer_id: nehaShah.customer_id,
        contact_type_id: mobileContactType.contact_type_id,
        contact_value: '+1-519-555-2006',
        is_primary: true,
        is_verified: true,
        created_by: nirali.user_id,
        updated_by: nirali.user_id,
        is_active: true,
      },
      {
        customer_id: nehaShah.customer_id,
        contact_type_id: emailContactType.contact_type_id,
        contact_value: 'neha.shah@demo.creditpulse.com',
        is_primary: false,
        is_verified: true,
        created_by: nirali.user_id,
        updated_by: nirali.user_id,
        is_active: true,
      },
      {
        customer_id: devPatel.customer_id,
        contact_type_id: mobileContactType.contact_type_id,
        contact_value: '+1-519-555-2007',
        is_primary: true,
        is_verified: true,
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        customer_id: devPatel.customer_id,
        contact_type_id: emailContactType.contact_type_id,
        contact_value: 'dev.patel@demo.creditpulse.com',
        is_primary: false,
        is_verified: true,
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        customer_id: ishaNair.customer_id,
        contact_type_id: mobileContactType.contact_type_id,
        contact_value: '+1-519-555-2008',
        is_primary: true,
        is_verified: true,
        created_by: miswa.user_id,
        updated_by: miswa.user_id,
        is_active: true,
      },
      {
        customer_id: ishaNair.customer_id,
        contact_type_id: emailContactType.contact_type_id,
        contact_value: 'isha.nair@demo.creditpulse.com',
        is_primary: false,
        is_verified: true,
        created_by: miswa.user_id,
        updated_by: miswa.user_id,
        is_active: true,
      },
    ],
  });

  await prisma.customer_address_details.createMany({
    data: [
      {
        customer_id: amanSharma.customer_id,
        address_type_id: homeAddressType.address_type_id,
        line1: '24 Benton Street',
        line2: 'Unit 2B',
        city: 'Kitchener',
        state_province: 'ON',
        postal_code: 'N2G 3H2',
        country_id: canada.country_id,
        is_primary: true,
        is_active: true,
      },
      {
        customer_id: priyaVerma.customer_id,
        address_type_id: homeAddressType.address_type_id,
        line1: '88 King Street East',
        line2: 'Apartment 705',
        city: 'Kitchener',
        state_province: 'ON',
        postal_code: 'N2G 2K2',
        country_id: canada.country_id,
        is_primary: true,
        is_active: true,
      },
      {
        customer_id: rahulSingh.customer_id,
        address_type_id: homeAddressType.address_type_id,
        line1: '51 College Street',
        line2: null,
        city: 'Waterloo',
        state_province: 'ON',
        postal_code: 'N2L 3Z3',
        country_id: canada.country_id,
        is_primary: true,
        is_active: true,
      },
      {
        customer_id: simranKaur.customer_id,
        address_type_id: homeAddressType.address_type_id,
        line1: '109 Queen Street South',
        line2: 'Basement Unit',
        city: 'Kitchener',
        state_province: 'ON',
        postal_code: 'N2G 1W1',
        country_id: canada.country_id,
        is_primary: true,
        is_active: true,
      },
      {
        customer_id: amanJoshi.customer_id,
        address_type_id: workAddressType.address_type_id,
        line1: '355 Hagey Boulevard',
        line2: 'Suite 410',
        city: 'Waterloo',
        state_province: 'ON',
        postal_code: 'N2L 0A7',
        country_id: canada.country_id,
        is_primary: true,
        is_active: true,
      },
      {
        customer_id: nehaShah.customer_id,
        address_type_id: homeAddressType.address_type_id,
        line1: '11 Wellington Street North',
        line2: 'Unit 1204',
        city: 'Kitchener',
        state_province: 'ON',
        postal_code: 'N2H 5J3',
        country_id: canada.country_id,
        is_primary: true,
        is_active: true,
      },
      {
        customer_id: devPatel.customer_id,
        address_type_id: workAddressType.address_type_id,
        line1: '560 University Avenue West',
        line2: 'Floor 6',
        city: 'Waterloo',
        state_province: 'ON',
        postal_code: 'N2L 6J8',
        country_id: canada.country_id,
        is_primary: true,
        is_active: true,
      },
      {
        customer_id: ishaNair.customer_id,
        address_type_id: homeAddressType.address_type_id,
        line1: '7 Duke Street West',
        line2: 'Unit 909',
        city: 'Kitchener',
        state_province: 'ON',
        postal_code: 'N2H 3W8',
        country_id: canada.country_id,
        is_primary: true,
        is_active: true,
      },
    ],
  });

  await prisma.customer_employment_details.createMany({
    data: [
      {
        customer_id: amanSharma.customer_id,
        employment_type_id: fullTimeEmployment.employment_type_id,
        employer_name: 'TechBridge Solutions',
        job_title: 'Implementation Specialist',
        work_experience_years: '4.50',
        monthly_income: '6200.00',
        is_active: true,
      },
      {
        customer_id: priyaVerma.customer_id,
        employment_type_id: fullTimeEmployment.employment_type_id,
        employer_name: 'Maple Health Group',
        job_title: 'Operations Coordinator',
        work_experience_years: '5.25',
        monthly_income: '7100.00',
        is_active: true,
      },
      {
        customer_id: rahulSingh.customer_id,
        employment_type_id: fullTimeEmployment.employment_type_id,
        employer_name: 'Northfield Logistics',
        job_title: 'Warehouse Supervisor',
        work_experience_years: '7.00',
        monthly_income: '6800.00',
        is_active: true,
      },
      {
        customer_id: simranKaur.customer_id,
        employment_type_id: partTimeEmployment.employment_type_id,
        employer_name: 'Conestoga College',
        job_title: 'Student Services Assistant',
        work_experience_years: '1.80',
        monthly_income: '2400.00',
        is_active: true,
      },
      {
        customer_id: amanJoshi.customer_id,
        employment_type_id: fullTimeEmployment.employment_type_id,
        employer_name: 'Velocity Auto Finance',
        job_title: 'Relationship Manager',
        work_experience_years: '6.20',
        monthly_income: '7600.00',
        is_active: true,
      },
      {
        customer_id: nehaShah.customer_id,
        employment_type_id: partTimeEmployment.employment_type_id,
        employer_name: 'RetailHub Canada',
        job_title: 'Shift Lead',
        work_experience_years: '2.40',
        monthly_income: '2900.00',
        is_active: true,
      },
      {
        customer_id: devPatel.customer_id,
        employment_type_id: fullTimeEmployment.employment_type_id,
        employer_name: 'ClearStone Consulting',
        job_title: 'Business Analyst',
        work_experience_years: '8.10',
        monthly_income: '8400.00',
        is_active: true,
      },
      {
        customer_id: ishaNair.customer_id,
        employment_type_id: fullTimeEmployment.employment_type_id,
        employer_name: 'InsightCare Inc.',
        job_title: 'Case Manager',
        work_experience_years: '3.60',
        monthly_income: '5900.00',
        is_active: true,
      },
    ],
  });

  await prisma.customer_liabilities.createMany({
    data: [
      {
        customer_id: amanSharma.customer_id,
        liability_type_id: personalLoanLiabilityType.liability_type_id,
        lender_name: 'Axis Bank',
        account_reference_masked: 'PL-AXIS-1101',
        monthly_payment: '450.00',
        outstanding_balance: '7800.00',
        is_active: true,
      },
      {
        customer_id: priyaVerma.customer_id,
        liability_type_id: creditCardLiabilityType.liability_type_id,
        lender_name: 'RBC',
        account_reference_masked: 'CC-RBC-2202',
        monthly_payment: '220.00',
        outstanding_balance: '3100.00',
        is_active: true,
      },
      {
        customer_id: rahulSingh.customer_id,
        liability_type_id: homeLoanLiabilityType.liability_type_id,
        lender_name: 'TD',
        account_reference_masked: 'HL-TD-3303',
        monthly_payment: '1650.00',
        outstanding_balance: '182000.00',
        is_active: true,
      },
      {
        customer_id: simranKaur.customer_id,
        liability_type_id: creditCardLiabilityType.liability_type_id,
        lender_name: 'CIBC',
        account_reference_masked: 'CC-CIBC-4404',
        monthly_payment: '125.00',
        outstanding_balance: '1800.00',
        is_active: true,
      },
      {
        customer_id: amanJoshi.customer_id,
        liability_type_id: autoLoanLiabilityType.liability_type_id,
        lender_name: 'Scotiabank',
        account_reference_masked: 'AL-SCOTIA-5505',
        monthly_payment: '540.00',
        outstanding_balance: '12900.00',
        is_active: true,
      },
      {
        customer_id: nehaShah.customer_id,
        liability_type_id: creditCardLiabilityType.liability_type_id,
        lender_name: 'American Express',
        account_reference_masked: 'CC-AMEX-6606',
        monthly_payment: '160.00',
        outstanding_balance: '2400.00',
        is_active: true,
      },
      {
        customer_id: devPatel.customer_id,
        liability_type_id: personalLoanLiabilityType.liability_type_id,
        lender_name: 'RBC',
        account_reference_masked: 'PL-RBC-7707',
        monthly_payment: '610.00',
        outstanding_balance: '9400.00',
        is_active: true,
      },
      {
        customer_id: ishaNair.customer_id,
        liability_type_id: autoLoanLiabilityType.liability_type_id,
        lender_name: 'CIBC',
        account_reference_masked: 'AL-CIBC-8808',
        monthly_payment: '430.00',
        outstanding_balance: '8600.00',
        is_active: true,
      },
    ],
  });

  const governmentIdRows = [
    {
      customer_id: amanSharma.customer_id,
      government_id_type_id: sinType.government_id_type_id,
      value: 'SIN00001001',
    },
    {
      customer_id: priyaVerma.customer_id,
      government_id_type_id: passportType.government_id_type_id,
      value: 'P12345002',
    },
    {
      customer_id: rahulSingh.customer_id,
      government_id_type_id: sinType.government_id_type_id,
      value: 'SIN00001003',
    },
    {
      customer_id: simranKaur.customer_id,
      government_id_type_id: drivingLicenceType.government_id_type_id,
      value: 'DLK-44004',
    },
    {
      customer_id: amanJoshi.customer_id,
      government_id_type_id: sinType.government_id_type_id,
      value: 'SIN00001005',
    },
    {
      customer_id: nehaShah.customer_id,
      government_id_type_id: passportType.government_id_type_id,
      value: 'P12345006',
    },
    {
      customer_id: devPatel.customer_id,
      government_id_type_id: sinType.government_id_type_id,
      value: 'SIN00001007',
    },
    {
      customer_id: ishaNair.customer_id,
      government_id_type_id: drivingLicenceType.government_id_type_id,
      value: 'DLK-88008',
    },
  ];

  for (const governmentIdRow of governmentIdRows) {
    await prisma.customer_government_id.create({
      data: {
        customer_id: governmentIdRow.customer_id,
        government_id_type_id: governmentIdRow.government_id_type_id,
        government_id_number_masked: maskValue(governmentIdRow.value),
        government_id_number_encrypted: Buffer.from(governmentIdRow.value, 'utf8'),
        is_primary: true,
        is_active: true,
      },
    });
  }

  const bankDetailRows = [
    {
      customer_id: amanSharma.customer_id,
      bank_id: rbc.bank_id,
      bank_account_type_id: chequingAccountType.bank_account_type_id,
      value: 'RBC50010001',
    },
    {
      customer_id: priyaVerma.customer_id,
      bank_id: td.bank_id,
      bank_account_type_id: savingsAccountType.bank_account_type_id,
      value: 'TD50010002',
    },
    {
      customer_id: rahulSingh.customer_id,
      bank_id: cibc.bank_id,
      bank_account_type_id: currentAccountType.bank_account_type_id,
      value: 'CIBC50010003',
    },
    {
      customer_id: simranKaur.customer_id,
      bank_id: rbc.bank_id,
      bank_account_type_id: chequingAccountType.bank_account_type_id,
      value: 'RBC50010004',
    },
    {
      customer_id: amanJoshi.customer_id,
      bank_id: td.bank_id,
      bank_account_type_id: chequingAccountType.bank_account_type_id,
      value: 'TD50010005',
    },
    {
      customer_id: nehaShah.customer_id,
      bank_id: cibc.bank_id,
      bank_account_type_id: savingsAccountType.bank_account_type_id,
      value: 'CIBC50010006',
    },
    {
      customer_id: devPatel.customer_id,
      bank_id: rbc.bank_id,
      bank_account_type_id: currentAccountType.bank_account_type_id,
      value: 'RBC50010007',
    },
    {
      customer_id: ishaNair.customer_id,
      bank_id: td.bank_id,
      bank_account_type_id: chequingAccountType.bank_account_type_id,
      value: 'TD50010008',
    },
  ];

  for (const bankDetailRow of bankDetailRows) {
    await prisma.customer_bank_details.create({
      data: {
        customer_id: bankDetailRow.customer_id,
        bank_id: bankDetailRow.bank_id,
        bank_account_type_id: bankDetailRow.bank_account_type_id,
        account_number_masked: maskValue(bankDetailRow.value),
        account_number_encrypted: Buffer.from(bankDetailRow.value, 'utf8'),
        is_primary: true,
        is_active: true,
      },
    });
  }

  await prisma.customer_document_details.createMany({
    data: [
      {
        customer_id: amanSharma.customer_id,
        document_type_id: governmentIdDocumentType.document_type_id,
        document_name: 'aman-sharma-government-id.pdf',
        document_path: '/seed/customer-documents/aman-sharma-government-id.pdf',
        mime_type: 'application/pdf',
        file_size_bytes: BigInt(248120),
        is_active: true,
      },
      {
        customer_id: priyaVerma.customer_id,
        document_type_id: bankStatementDocumentType.document_type_id,
        document_name: 'priya-verma-bank-statement.pdf',
        document_path: '/seed/customer-documents/priya-verma-bank-statement.pdf',
        mime_type: 'application/pdf',
        file_size_bytes: BigInt(312560),
        is_active: true,
      },
      {
        customer_id: rahulSingh.customer_id,
        document_type_id: payslipDocumentType.document_type_id,
        document_name: 'rahul-singh-payslip-march.pdf',
        document_path: '/seed/customer-documents/rahul-singh-payslip-march.pdf',
        mime_type: 'application/pdf',
        file_size_bytes: BigInt(201455),
        is_active: true,
      },
      {
        customer_id: simranKaur.customer_id,
        document_type_id: addressProofDocumentType.document_type_id,
        document_name: 'simran-kaur-address-proof.pdf',
        document_path: '/seed/customer-documents/simran-kaur-address-proof.pdf',
        mime_type: 'application/pdf',
        file_size_bytes: BigInt(176890),
        is_active: true,
      },
      {
        customer_id: amanJoshi.customer_id,
        document_type_id: bankStatementDocumentType.document_type_id,
        document_name: 'aman-joshi-bank-statement.pdf',
        document_path: '/seed/customer-documents/aman-joshi-bank-statement.pdf',
        mime_type: 'application/pdf',
        file_size_bytes: BigInt(286030),
        is_active: true,
      },
      {
        customer_id: nehaShah.customer_id,
        document_type_id: governmentIdDocumentType.document_type_id,
        document_name: 'neha-shah-passport.pdf',
        document_path: '/seed/customer-documents/neha-shah-passport.pdf',
        mime_type: 'application/pdf',
        file_size_bytes: BigInt(192450),
        is_active: true,
      },
      {
        customer_id: devPatel.customer_id,
        document_type_id: payslipDocumentType.document_type_id,
        document_name: 'dev-patel-salary-slip.pdf',
        document_path: '/seed/customer-documents/dev-patel-salary-slip.pdf',
        mime_type: 'application/pdf',
        file_size_bytes: BigInt(214300),
        is_active: true,
      },
      {
        customer_id: ishaNair.customer_id,
        document_type_id: addressProofDocumentType.document_type_id,
        document_name: 'isha-nair-address-proof.pdf',
        document_path: '/seed/customer-documents/isha-nair-address-proof.pdf',
        mime_type: 'application/pdf',
        file_size_bytes: BigInt(181780),
        is_active: true,
      },
    ],
  });

  await prisma.customer_education_details.createMany({
    data: [
      {
        customer_id: amanSharma.customer_id,
        education_level_id: bachelorsEducation.education_level_id,
        institution_id: uoft.institution_id,
        field_of_study: 'Computer Science',
        graduation_year: 2020,
        is_active: true,
      },
      {
        customer_id: priyaVerma.customer_id,
        education_level_id: mastersEducation.education_level_id,
        institution_id: mcmaster.institution_id,
        field_of_study: 'Finance',
        graduation_year: 2019,
        is_active: true,
      },
      {
        customer_id: rahulSingh.customer_id,
        education_level_id: bachelorsEducation.education_level_id,
        institution_id: conestoga.institution_id,
        field_of_study: 'Supply Chain Management',
        graduation_year: 2017,
        is_active: true,
      },
      {
        customer_id: simranKaur.customer_id,
        education_level_id: bachelorsEducation.education_level_id,
        institution_id: conestoga.institution_id,
        field_of_study: 'Business Administration',
        graduation_year: 2024,
        is_active: true,
      },
      {
        customer_id: amanJoshi.customer_id,
        education_level_id: mastersEducation.education_level_id,
        institution_id: uoft.institution_id,
        field_of_study: 'Marketing',
        graduation_year: 2018,
        is_active: true,
      },
      {
        customer_id: nehaShah.customer_id,
        education_level_id: bachelorsEducation.education_level_id,
        institution_id: conestoga.institution_id,
        field_of_study: 'Hospitality Management',
        graduation_year: 2023,
        is_active: true,
      },
      {
        customer_id: devPatel.customer_id,
        education_level_id: mastersEducation.education_level_id,
        institution_id: mcmaster.institution_id,
        field_of_study: 'Business Analytics',
        graduation_year: 2016,
        is_active: true,
      },
      {
        customer_id: ishaNair.customer_id,
        education_level_id: bachelorsEducation.education_level_id,
        institution_id: uoft.institution_id,
        field_of_study: 'Psychology',
        graduation_year: 2020,
        is_active: true,
      },
    ],
  });

  await prisma.customer_income_sources.createMany({
    data: [
      {
        customer_id: amanSharma.customer_id,
        income_source_type_id: salaryIncomeType.income_source_type_id,
        monthly_amount: '6200.00',
        description: 'Primary salary from TechBridge Solutions',
        is_active: true,
      },
      {
        customer_id: priyaVerma.customer_id,
        income_source_type_id: salaryIncomeType.income_source_type_id,
        monthly_amount: '7100.00',
        description: 'Operations salary',
        is_active: true,
      },
      {
        customer_id: rahulSingh.customer_id,
        income_source_type_id: salaryIncomeType.income_source_type_id,
        monthly_amount: '6800.00',
        description: 'Warehouse supervisor salary',
        is_active: true,
      },
      {
        customer_id: simranKaur.customer_id,
        income_source_type_id: freelanceIncomeType.income_source_type_id,
        monthly_amount: '900.00',
        description: 'Freelance design projects',
        is_active: true,
      },
      {
        customer_id: amanJoshi.customer_id,
        income_source_type_id: businessIncomeType.income_source_type_id,
        monthly_amount: '7600.00',
        description: 'Relationship management incentive income',
        is_active: true,
      },
      {
        customer_id: nehaShah.customer_id,
        income_source_type_id: salaryIncomeType.income_source_type_id,
        monthly_amount: '2900.00',
        description: 'Retail salary',
        is_active: true,
      },
      {
        customer_id: devPatel.customer_id,
        income_source_type_id: rentalIncomeType.income_source_type_id,
        monthly_amount: '1400.00',
        description: 'Basement rental income',
        is_active: true,
      },
      {
        customer_id: devPatel.customer_id,
        income_source_type_id: salaryIncomeType.income_source_type_id,
        monthly_amount: '8400.00',
        description: 'Consulting salary',
        is_active: true,
      },
      {
        customer_id: ishaNair.customer_id,
        income_source_type_id: salaryIncomeType.income_source_type_id,
        monthly_amount: '5900.00',
        description: 'Case manager salary',
        is_active: true,
      },
      {
        customer_id: ishaNair.customer_id,
        income_source_type_id: pensionIncomeType.income_source_type_id,
        monthly_amount: '450.00',
        description: 'Family survivor benefit',
        is_active: true,
      },
    ],
  });

  const cibilReports = await prisma.cibil_reports.findMany({
    include: {
      loan_application: {
        select: {
          application_id: true,
          application_number: true,
        },
      },
    },
    orderBy: {
      report_date: 'desc',
    },
  });

  const reportApplicationIds = cibilReports.map((report) => report.application_id);

  if (reportApplicationIds.length > 0) {
    await prisma.application_credit_check.deleteMany({
      where: {
        application_id: {
          in: reportApplicationIds,
        },
      },
    });

    const reviewerIds = [nirali.user_id, miswa.user_id, victor.user_id, sukh.user_id];

    await prisma.application_credit_check.createMany({
      data: cibilReports.map((report, index) => ({
        application_id: report.application_id,
        cibil_report_id: report.cibil_report_id,
        request_id: report.request_id,
        bureau_name: report.bureau,
        bureau_reference_id: report.reference_id,
        bureau_status: report.status,
        credit_score: report.cibil_score,
        score_band: report.score_band,
        risk_level: report.risk_level,
        checked_at: report.report_date,
        checked_by: reviewerIds[index % reviewerIds.length],
        remarks:
          report.risk_level === 'VERY_LOW' || report.risk_level === 'LOW'
            ? 'Credit bureau response received with acceptable risk profile.'
            : report.risk_level === 'MEDIUM'
              ? 'Credit bureau response received and marked for manual underwriting review.'
              : 'Credit bureau response received with elevated risk indicators requiring tighter review.',
        raw_response: {
          application_number: report.loan_application.application_number,
          bureau: report.bureau,
          request_id: report.request_id,
          reference_id: report.reference_id,
          score: report.cibil_score,
          score_band: report.score_band,
          risk_level: report.risk_level,
          report_date: report.report_date.toISOString(),
          total_accounts: report.total_accounts,
          active_accounts: report.active_accounts,
          closed_accounts: report.closed_accounts,
          total_outstanding_balance: report.total_outstanding_balance.toString(),
          recent_delinquency: report.recent_delinquency,
          credit_utilization_ratio: report.credit_utilization_ratio.toString(),
          average_account_age_years: report.average_account_age_years.toString(),
          debt_to_income_estimate: report.debt_to_income_estimate.toString(),
        },
        is_latest: true,
      })),
    });
  }

  console.log('Supplemental seed completed successfully.');
  console.log('Covered tables:');
  console.log('- genders');
  console.log('- marital_statuses');
  console.log('- countries');
  console.log('- government_id_types');
  console.log('- contact_types');
  console.log('- income_source_types');
  console.log('- liability_types');
  console.log('- bank_account_types');
  console.log('- document_types');
  console.log('- customer_contact_details');
  console.log('- customer_address_details');
  console.log('- customer_employment_details');
  console.log('- customer_liabilities');
  console.log('- customer_government_id');
  console.log('- customer_bank_details');
  console.log('- customer_document_details');
  console.log('- customer_education_details');
  console.log('- customer_income_sources');
  console.log('- application_credit_check');
}

async function getRequiredApplication(applicationNumber: string) {
  const application = await prisma.loan_application.findFirst({
    where: { application_number: applicationNumber },
    select: {
      application_id: true,
      application_number: true,
    },
  });

  if (!application) {
    throw new Error(`Required seeded application not found: ${applicationNumber}`);
  }

  return application;
}

async function seedApplicationCommunication() {
  console.log('Starting seed for application communication history...');

  const victor = await getRequiredUser('victor@creditpulse.com');
  const miswa = await getRequiredUser('miswa@creditpulse.com');
  const nirali = await getRequiredUser('nirali@creditpulse.com');
  const sukh = await getRequiredUser('sukh@creditpulse.com');

  const amanSharma = await getRequiredCustomer('Aman', 'Sharma', '1997-02-14');
  const priyaVerma = await getRequiredCustomer('Priya', 'Verma', '1995-11-03');
  const rahulSingh = await getRequiredCustomer('Rahul', 'Singh', '1992-07-28');
  const simranKaur = await getRequiredCustomer('Simran', 'Kaur', '2000-05-19');

  const app1 = await getRequiredApplication('APPL0000000001');
  const app2 = await getRequiredApplication('APPL0000000002');
  const app3 = await getRequiredApplication('APPL0000000003');
  const app4 = await getRequiredApplication('APPL0000000004');

  await prisma.application_message_attachment.deleteMany({
    where: {
      application_id: {
        in: [app1.application_id, app2.application_id, app3.application_id, app4.application_id],
      },
    },
  });

  await prisma.application_communication_history.deleteMany({
    where: {
      application_id: {
        in: [app1.application_id, app2.application_id, app3.application_id, app4.application_id],
      },
    },
  });

  const app1Message1 = await prisma.application_communication_history.create({
    data: {
      application_id: app1.application_id,
      sender_user_id: nirali.user_id,
      sender_type: 'SOURCING_OFFICER',
      recipient_user_id: amanSharma.customer_id,
      recipient_type: 'CUSTOMER',
      message_text:
        'Welcome to Credit Pulse. Please upload your last 3 months bank statements and one government ID proof.',
      message_category: 'DOCUMENT_REQUEST',
      is_internal: false,
      send_email: true,
      send_sms: true,
      email_status: 'QUEUED',
      sms_status: 'QUEUED',
      has_attachment: true,
      created_by: nirali.user_id,
      updated_by: nirali.user_id,
      is_deleted: false,
    },
  });

  await prisma.application_message_attachment.createMany({
    data: [
      {
        message_id: app1Message1.message_id,
        application_id: app1.application_id,
        document_name: 'msg-app1-doc-request-checklist.pdf',
        original_file_name: 'document-checklist.pdf',
        document_path:
          's3://creditpulse/application-messages/APPL0000000001/msg-app1-doc-request-checklist.pdf',
        mime_type: 'application/pdf',
        file_size_bytes: BigInt(184320),
        uploaded_by: nirali.user_id,
        is_active: true,
        is_deleted: false,
      },
      {
        message_id: app1Message1.message_id,
        application_id: app1.application_id,
        document_name: 'msg-app1-kyc-guidelines.pdf',
        original_file_name: 'kyc-guidelines.pdf',
        document_path:
          's3://creditpulse/application-messages/APPL0000000001/msg-app1-kyc-guidelines.pdf',
        mime_type: 'application/pdf',
        file_size_bytes: BigInt(223560),
        uploaded_by: nirali.user_id,
        is_active: true,
        is_deleted: false,
      },
    ],
  });

  const app1Message2 = await prisma.application_communication_history.create({
    data: {
      application_id: app1.application_id,
      sender_user_id: amanSharma.customer_id,
      sender_type: 'CUSTOMER',
      recipient_user_id: nirali.user_id,
      recipient_type: 'SOURCING_OFFICER',
      message_text:
        'I have reviewed the checklist. I will upload my bank statements by today evening.',
      message_category: 'TEXT',
      is_internal: false,
      send_email: false,
      send_sms: false,
      email_status: 'NOT_REQUESTED',
      sms_status: 'NOT_REQUESTED',
      has_attachment: false,
      created_by: amanSharma.customer_id,
      updated_by: amanSharma.customer_id,
      is_deleted: false,
    },
  });

  const app2Message1 = await prisma.application_communication_history.create({
    data: {
      application_id: app2.application_id,
      sender_user_id: miswa.user_id,
      sender_type: 'UNDERWRITER',
      recipient_user_id: sukh.user_id,
      recipient_type: 'DISBURSAL_OFFICER',
      message_text:
        'Income documents verified. File can move to the next underwriting checkpoint after final risk note review.',
      message_category: 'INTERNAL_NOTE',
      is_internal: true,
      send_email: false,
      send_sms: false,
      email_status: 'NOT_REQUESTED',
      sms_status: 'NOT_REQUESTED',
      has_attachment: true,
      created_by: miswa.user_id,
      updated_by: miswa.user_id,
      is_deleted: false,
    },
  });

  await prisma.application_message_attachment.create({
    data: {
      message_id: app2Message1.message_id,
      application_id: app2.application_id,
      document_name: 'msg-app2-underwriter-note.pdf',
      original_file_name: 'underwriter-note.pdf',
      document_path:
        's3://creditpulse/application-messages/APPL0000000002/msg-app2-underwriter-note.pdf',
      mime_type: 'application/pdf',
      file_size_bytes: BigInt(156780),
      uploaded_by: miswa.user_id,
      is_active: true,
      is_deleted: false,
    },
  });

  const app2Message2 = await prisma.application_communication_history.create({
    data: {
      application_id: app2.application_id,
      sender_user_id: sukh.user_id,
      sender_type: 'DISBURSAL_OFFICER',
      recipient_user_id: priyaVerma.customer_id,
      recipient_type: 'CUSTOMER',
      message_text:
        'Your application is under review. We may contact you if any additional documents are required.',
      message_category: 'STATUS_UPDATE',
      is_internal: false,
      send_email: true,
      send_sms: false,
      email_status: 'QUEUED',
      sms_status: 'NOT_REQUESTED',
      has_attachment: false,
      created_by: sukh.user_id,
      updated_by: sukh.user_id,
      is_deleted: false,
    },
  });

  const app3Message1 = await prisma.application_communication_history.create({
    data: {
      application_id: app3.application_id,
      sender_user_id: victor.user_id,
      sender_type: 'UNDERWRITER',
      recipient_user_id: rahulSingh.customer_id,
      recipient_type: 'CUSTOMER',
      message_text:
        'Your business loan has been approved. Please review the attached sanction letter and repayment summary.',
      message_category: 'STATUS_UPDATE',
      is_internal: false,
      send_email: true,
      send_sms: true,
      email_status: 'SENT',
      sms_status: 'SENT',
      has_attachment: true,
      created_by: victor.user_id,
      updated_by: victor.user_id,
      is_deleted: false,
    },
  });

  await prisma.application_message_attachment.createMany({
    data: [
      {
        message_id: app3Message1.message_id,
        application_id: app3.application_id,
        document_name: 'msg-app3-sanction-letter.pdf',
        original_file_name: 'sanction-letter.pdf',
        document_path:
          's3://creditpulse/application-messages/APPL0000000003/msg-app3-sanction-letter.pdf',
        mime_type: 'application/pdf',
        file_size_bytes: BigInt(261442),
        uploaded_by: victor.user_id,
        is_active: true,
        is_deleted: false,
      },
      {
        message_id: app3Message1.message_id,
        application_id: app3.application_id,
        document_name: 'msg-app3-repayment-summary.pdf',
        original_file_name: 'repayment-summary.pdf',
        document_path:
          's3://creditpulse/application-messages/APPL0000000003/msg-app3-repayment-summary.pdf',
        mime_type: 'application/pdf',
        file_size_bytes: BigInt(197804),
        uploaded_by: victor.user_id,
        is_active: true,
        is_deleted: false,
      },
    ],
  });

  const app4Message1 = await prisma.application_communication_history.create({
    data: {
      application_id: app4.application_id,
      sender_user_id: sukh.user_id,
      sender_type: 'DISBURSAL_OFFICER',
      recipient_user_id: victor.user_id,
      recipient_type: 'UNDERWRITER',
      message_text:
        'Disbursal completed successfully. Customer acknowledgment and transfer proof have been attached for audit.',
      message_category: 'INTERNAL_NOTE',
      is_internal: true,
      send_email: false,
      send_sms: false,
      email_status: 'NOT_REQUESTED',
      sms_status: 'NOT_REQUESTED',
      has_attachment: true,
      created_by: sukh.user_id,
      updated_by: sukh.user_id,
      is_deleted: false,
    },
  });

  await prisma.application_message_attachment.createMany({
    data: [
      {
        message_id: app4Message1.message_id,
        application_id: app4.application_id,
        document_name: 'msg-app4-disbursal-proof.pdf',
        original_file_name: 'disbursal-proof.pdf',
        document_path:
          's3://creditpulse/application-messages/APPL0000000004/msg-app4-disbursal-proof.pdf',
        mime_type: 'application/pdf',
        file_size_bytes: BigInt(208540),
        uploaded_by: sukh.user_id,
        is_active: true,
        is_deleted: false,
      },
      {
        message_id: app4Message1.message_id,
        application_id: app4.application_id,
        document_name: 'msg-app4-customer-acknowledgement.pdf',
        original_file_name: 'customer-acknowledgement.pdf',
        document_path:
          's3://creditpulse/application-messages/APPL0000000004/msg-app4-customer-acknowledgement.pdf',
        mime_type: 'application/pdf',
        file_size_bytes: BigInt(143990),
        uploaded_by: sukh.user_id,
        is_active: true,
        is_deleted: false,
      },
    ],
  });

  const app4Message2 = await prisma.application_communication_history.create({
    data: {
      application_id: app4.application_id,
      sender_user_id: simranKaur.customer_id,
      sender_type: 'CUSTOMER',
      recipient_user_id: sukh.user_id,
      recipient_type: 'DISBURSAL_OFFICER',
      message_text: 'Thank you. I confirm the funds have been received in my account.',
      message_category: 'TEXT',
      is_internal: false,
      send_email: false,
      send_sms: false,
      email_status: 'NOT_REQUESTED',
      sms_status: 'NOT_REQUESTED',
      has_attachment: false,
      created_by: simranKaur.customer_id,
      updated_by: simranKaur.customer_id,
      is_deleted: false,
    },
  });

  console.log('Application communication history seeded successfully.');
  console.log('Seeded message ids:');
  console.log(app1Message1.message_id);
  console.log(app1Message2.message_id);
  console.log(app2Message1.message_id);
  console.log(app2Message2.message_id);
  console.log(app3Message1.message_id);
  console.log(app4Message1.message_id);
  console.log(app4Message2.message_id);
}

async function seedEligibilityEngine() {
  console.log('Starting seed for eligibility rule engine...');

  const victor = await getRequiredUser('victor@creditpulse.com');
  const nirali = await getRequiredUser('nirali@creditpulse.com');
  const miswa = await getRequiredUser('miswa@creditpulse.com');
  const sukh = await getRequiredUser('sukh@creditpulse.com');

  await prisma.application_eligibility_summary.deleteMany();
  await prisma.eligibility_rule.deleteMany();
  await prisma.eligibility_rule_set.deleteMany();

  const defaultRuleSet = await prisma.eligibility_rule_set.create({
    data: {
      rule_set_code: 'DEFAULT_ELIGIBILITY',
      rule_set_name: 'Default Eligibility Rules',
      version_no: 1,
      description: 'Default rule set for loan eligibility decisioning',
      effective_from: new Date('2026-04-01T00:00:00Z'),
      is_active: true,
      created_by: victor.user_id,
      updated_by: victor.user_id,
    },
  });

  await prisma.eligibility_rule.createMany({
    data: [
      {
        rule_set_id: defaultRuleSet.rule_set_id,
        rule_code: 'CREDIT_SCORE_SOFT_MIN',
        rule_name: 'Minimum Credit Score',
        metric_name: 'credit_score',
        operator: '>=',
        threshold_value: '650',
        severity: 'SOFT_FAIL',
        failure_message: 'Credit score is below the preferred threshold.',
        evaluation_order: 1,
        is_active: true,
        created_by: victor.user_id,
        updated_by: victor.user_id,
      },
      {
        rule_set_id: defaultRuleSet.rule_set_id,
        rule_code: 'CREDIT_SCORE_HARD_MIN',
        rule_name: 'Hard Minimum Credit Score',
        metric_name: 'credit_score',
        operator: '>=',
        threshold_value: '600',
        severity: 'HARD_FAIL',
        failure_message: 'Credit score is below the minimum allowed threshold.',
        evaluation_order: 2,
        is_active: true,
        created_by: victor.user_id,
        updated_by: victor.user_id,
      },
      {
        rule_set_id: defaultRuleSet.rule_set_id,
        rule_code: 'DBR_SOFT_MAX',
        rule_name: 'Maximum DBR',
        metric_name: 'dbr',
        operator: '<=',
        threshold_value: '40',
        severity: 'SOFT_FAIL',
        failure_message: 'Debt burden ratio is above the preferred limit.',
        evaluation_order: 3,
        is_active: true,
        created_by: victor.user_id,
        updated_by: victor.user_id,
      },
      {
        rule_set_id: defaultRuleSet.rule_set_id,
        rule_code: 'DBR_HARD_MAX',
        rule_name: 'Hard Maximum DBR',
        metric_name: 'dbr',
        operator: '<=',
        threshold_value: '50',
        severity: 'HARD_FAIL',
        failure_message: 'Debt burden ratio exceeds the maximum allowed limit.',
        evaluation_order: 4,
        is_active: true,
        created_by: victor.user_id,
        updated_by: victor.user_id,
      },
      {
        rule_set_id: defaultRuleSet.rule_set_id,
        rule_code: 'EMI_TO_INCOME_SOFT_MAX',
        rule_name: 'Maximum EMI To Income',
        metric_name: 'emi_to_income',
        operator: '<=',
        threshold_value: '35',
        severity: 'SOFT_FAIL',
        failure_message: 'EMI-to-income ratio is above the preferred limit.',
        evaluation_order: 5,
        is_active: true,
        created_by: victor.user_id,
        updated_by: victor.user_id,
      },
      {
        rule_set_id: defaultRuleSet.rule_set_id,
        rule_code: 'EMI_TO_INCOME_HARD_MAX',
        rule_name: 'Hard Maximum EMI To Income',
        metric_name: 'emi_to_income',
        operator: '<=',
        threshold_value: '45',
        severity: 'HARD_FAIL',
        failure_message: 'EMI-to-income ratio exceeds the maximum allowed limit.',
        evaluation_order: 6,
        is_active: true,
        created_by: victor.user_id,
        updated_by: victor.user_id,
      },
      {
        rule_set_id: defaultRuleSet.rule_set_id,
        rule_code: 'CREDIT_UTILIZATION_SOFT_MAX',
        rule_name: 'Maximum Credit Utilization',
        metric_name: 'credit_utilization',
        operator: '<=',
        threshold_value: '60',
        severity: 'SOFT_FAIL',
        failure_message: 'Credit utilization is above the preferred limit.',
        evaluation_order: 7,
        is_active: true,
        created_by: victor.user_id,
        updated_by: victor.user_id,
      },
      {
        rule_set_id: defaultRuleSet.rule_set_id,
        rule_code: 'CREDIT_UTILIZATION_HARD_MAX',
        rule_name: 'Hard Maximum Credit Utilization',
        metric_name: 'credit_utilization',
        operator: '<=',
        threshold_value: '80',
        severity: 'HARD_FAIL',
        failure_message: 'Credit utilization exceeds the maximum allowed limit.',
        evaluation_order: 8,
        is_active: true,
        created_by: victor.user_id,
        updated_by: victor.user_id,
      },
      {
        rule_set_id: defaultRuleSet.rule_set_id,
        rule_code: 'LOAN_TO_INCOME_SOFT_MAX',
        rule_name: 'Maximum Loan To Income',
        metric_name: 'loan_to_income',
        operator: '<=',
        threshold_value: '50',
        severity: 'SOFT_FAIL',
        failure_message: 'Loan-to-income ratio is above the preferred limit.',
        evaluation_order: 9,
        is_active: true,
        created_by: victor.user_id,
        updated_by: victor.user_id,
      },
      {
        rule_set_id: defaultRuleSet.rule_set_id,
        rule_code: 'LOAN_TO_INCOME_HARD_MAX',
        rule_name: 'Hard Maximum Loan To Income',
        metric_name: 'loan_to_income',
        operator: '<=',
        threshold_value: '70',
        severity: 'HARD_FAIL',
        failure_message: 'Loan-to-income ratio exceeds the maximum allowed limit.',
        evaluation_order: 10,
        is_active: true,
        created_by: victor.user_id,
        updated_by: victor.user_id,
      },
      {
        rule_set_id: defaultRuleSet.rule_set_id,
        rule_code: 'BUREAU_STATUS_SUCCESS_ONLY',
        rule_name: 'Bureau Status Must Be Successful',
        metric_name: 'bureau_status',
        operator: '=',
        expected_value: 'SUCCESS',
        severity: 'HARD_FAIL',
        failure_message: 'Credit bureau status must be SUCCESS.',
        evaluation_order: 11,
        is_active: true,
        created_by: victor.user_id,
        updated_by: victor.user_id,
      },
      {
        rule_set_id: defaultRuleSet.rule_set_id,
        rule_code: 'RISK_LEVEL_BLOCK_HIGH',
        rule_name: 'Block High Risk Level',
        metric_name: 'risk_level',
        operator: '!=',
        expected_value: 'HIGH',
        severity: 'HARD_FAIL',
        failure_message: 'Applicant is marked as HIGH risk.',
        evaluation_order: 12,
        is_active: true,
        created_by: victor.user_id,
        updated_by: victor.user_id,
      },
      {
        rule_set_id: defaultRuleSet.rule_set_id,
        rule_code: 'MIN_MONTHLY_INCOME',
        rule_name: 'Minimum Monthly Income',
        metric_name: 'monthly_income',
        operator: '>=',
        threshold_value: '25000',
        severity: 'SOFT_FAIL',
        failure_message: 'Monthly income is below the preferred threshold.',
        evaluation_order: 13,
        is_active: true,
        created_by: victor.user_id,
        updated_by: victor.user_id,
      },
      {
        rule_set_id: defaultRuleSet.rule_set_id,
        rule_code: 'MIN_NET_SURPLUS_AFTER_EMI',
        rule_name: 'Minimum Net Surplus After EMI',
        metric_name: 'net_surplus_after_emi',
        operator: '>=',
        threshold_value: '10000',
        severity: 'HARD_FAIL',
        failure_message: 'Net surplus after EMI is below the minimum required threshold.',
        evaluation_order: 14,
        is_active: true,
        created_by: victor.user_id,
        updated_by: victor.user_id,
      },
      {
        rule_set_id: defaultRuleSet.rule_set_id,
        rule_code: 'MAX_AGE_AT_MATURITY',
        rule_name: 'Maximum Age At Loan Maturity',
        metric_name: 'age_at_maturity',
        operator: '<=',
        threshold_value: '65',
        severity: 'HARD_FAIL',
        failure_message: 'Applicant age at maturity exceeds the allowed maximum.',
        evaluation_order: 15,
        is_active: true,
        created_by: victor.user_id,
        updated_by: victor.user_id,
      },
    ],
  });

  const app6 = await getRequiredApplication('APPL0000000006');
  const app7 = await getRequiredApplication('APPL0000000007');
  const app9 = await getRequiredApplication('APPL0000000009');

  await prisma.application_eligibility_summary.createMany({
    data: [
      {
        application_id: app6.application_id,
        application_number: app6.application_number,
        rule_set_id: defaultRuleSet.rule_set_id,
        eligibility_status: 'ELIGIBLE',
        failed_rule_count: 0,
        reason_json: [],
        decision_snapshot_json: {
          credit_score: 742,
          dbr: 28.5,
          emi_to_income: 21.4,
          credit_utilization: 15,
          loan_to_income: 32.2,
          bureau_status: 'SUCCESS',
          risk_level: 'LOW',
          monthly_income: 62000,
          net_surplus_after_emi: 24800,
          age_at_maturity: 31,
        },
        calculated_at: new Date('2026-04-01T10:00:00Z'),
        created_by: nirali.user_id,
        updated_by: nirali.user_id,
        is_active: true,
      },
      {
        application_id: app7.application_id,
        application_number: app7.application_number,
        rule_set_id: defaultRuleSet.rule_set_id,
        eligibility_status: 'CONDITIONALLY_ELIGIBLE',
        failed_rule_count: 1,
        reason_json: ['Debt burden ratio is above the preferred limit.'],
        decision_snapshot_json: {
          credit_score: 801,
          dbr: 42.1,
          emi_to_income: 29.8,
          credit_utilization: 11,
          loan_to_income: 34.7,
          bureau_status: 'SUCCESS',
          risk_level: 'VERY_LOW',
          monthly_income: 78000,
          net_surplus_after_emi: 30100,
          age_at_maturity: 43,
        },
        calculated_at: new Date('2026-04-01T10:15:00Z'),
        created_by: miswa.user_id,
        updated_by: miswa.user_id,
        is_active: true,
      },
      {
        application_id: app9.application_id,
        application_number: app9.application_number,
        rule_set_id: defaultRuleSet.rule_set_id,
        eligibility_status: 'NOT_ELIGIBLE',
        failed_rule_count: 3,
        reason_json: [
          'Applicant is marked as HIGH risk.',
          'Credit utilization is above the preferred limit.',
          'EMI-to-income ratio exceeds the maximum allowed limit.',
        ],
        decision_snapshot_json: {
          credit_score: 615,
          dbr: 46.8,
          emi_to_income: 47.2,
          credit_utilization: 62,
          loan_to_income: 58.4,
          bureau_status: 'SUCCESS',
          risk_level: 'HIGH',
          monthly_income: 54000,
          net_surplus_after_emi: 8600,
          age_at_maturity: 51,
        },
        calculated_at: new Date('2026-04-01T10:30:00Z'),
        created_by: sukh.user_id,
        updated_by: sukh.user_id,
        is_active: true,
      },
    ],
  });

  console.log('Eligibility rule engine seeded successfully.');
}

async function seedTeams() {
  await prisma.teams.upsert({
    where: { team_code: 'SOURCING_TEAM' },
    update: {
      team_name: 'Sourcing Team',
      description: 'Handles sourcing and initial application processing.',
      is_active: true,
      updated_at: new Date(),
    },
    create: {
      team_id: crypto.randomUUID(),
      team_code: 'SOURCING_TEAM',
      team_name: 'Sourcing Team',
      description: 'Handles sourcing and initial application processing.',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  await prisma.teams.upsert({
    where: { team_code: 'UNDERWRITER_TEAM' },
    update: {
      team_name: 'Underwriter Team',
      description: 'Handles credit review and underwriting decisions.',
      is_active: true,
      updated_at: new Date(),
    },
    create: {
      team_id: crypto.randomUUID(),
      team_code: 'UNDERWRITER_TEAM',
      team_name: 'Underwriter Team',
      description: 'Handles credit review and underwriting decisions.',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  await prisma.teams.upsert({
    where: { team_code: 'DISBURSAL_TEAM' },
    update: {
      team_name: 'Disbursal Team',
      description: 'Handles loan disbursal and payout processing.',
      is_active: true,
      updated_at: new Date(),
    },
    create: {
      team_id: crypto.randomUUID(),
      team_code: 'DISBURSAL_TEAM',
      team_name: 'Disbursal Team',
      description: 'Handles loan disbursal and payout processing.',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  console.log('Teams seeded successfully.');
}

async function seedTeamMembers() {
  const sourcingTeam = await prisma.teams.findFirst({
    where: { team_code: 'SOURCING_TEAM' },
  });

  const underwriterTeam = await prisma.teams.findFirst({
    where: { team_code: 'UNDERWRITER_TEAM' },
  });

  const disbursalTeam = await prisma.teams.findFirst({
    where: { team_code: 'DISBURSAL_TEAM' },
  });

  if (!sourcingTeam || !underwriterTeam || !disbursalTeam) {
    throw new Error('Required teams not found. Please run seedTeams() first.');
  }

  const sukh = await getRequiredUser('sukh@creditpulse.com');
  const joyal = await getRequiredUser('joyal.aji@creditpulse.com');
  const praveen = await getRequiredUser('praveen.bangla@creditpulse.com');
  const yisa = await getRequiredUser('yisa.bankole@creditpulse.com');
  const sandip = await getRequiredUser('sandip.bharati@creditpulse.com');
  const birav = await getRequiredUser('birav.bhattrai@creditpulse.com');
  const shikha = await getRequiredUser('shikha.desai@creditpulse.com');
  const victorEnejo = await getRequiredUser('victor.enejo@creditpulse.com');
  const kandarpgiri = await getRequiredUser('kandarpgiri.gosai@creditpulse.com');
  const nisargkumar = await getRequiredUser('nisargkumar.goswami@creditpulse.com');
  const gurpreet = await getRequiredUser('gurpreet.singh@creditpulse.com');

  const miswa = await getRequiredUser('miswa@creditpulse.com');
  const tyler = await getRequiredUser('tyler.kobe@creditpulse.com');
  const sherrice = await getRequiredUser('sherrice.lyons@creditpulse.com');
  const shahid = await getRequiredUser('shahid.mahammed@creditpulse.com');
  const rajavardhan = await getRequiredUser('rajavardhan.reddy@creditpulse.com');
  const aakash = await getRequiredUser('aakash.nair@creditpulse.com');
  const james = await getRequiredUser('james.okeke@creditpulse.com');
  const emmanuel = await getRequiredUser('emmanuel.raji@creditpulse.com');
  const rutvik = await getRequiredUser('rutvik.patel@creditpulse.com');
  const vatsal = await getRequiredUser('vatsal.patel@creditpulse.com');
  const prabhjot = await getRequiredUser('prabhjot.singh@creditpulse.com');

  const nirali = await getRequiredUser('nirali@creditpulse.com');
  const vishwa = await getRequiredUser('vishwa.rana@creditpulse.com');
  const dhruti = await getRequiredUser('dhruti.rathod@creditpulse.com');
  const rajKumar = await getRequiredUser('raj.kumar@creditpulse.com');
  const honey = await getRequiredUser('honey.singh@creditpulse.com');
  const parminder = await getRequiredUser('parminder.singh@creditpulse.com');
  const christ = await getRequiredUser('christ.vijay@creditpulse.com');
  const ansh = await getRequiredUser('ansh.sukhija@creditpulse.com');
  const sukhjit = await getRequiredUser('sukhjit.kaur@creditpulse.com');
  const teena = await getRequiredUser('teena.thomas@creditpulse.com');

  await prisma.team_members.createMany({
    data: [
      {
        team_member_id: crypto.randomUUID(),
        team_id: sourcingTeam.team_id,
        user_id: sukh.user_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        team_member_id: crypto.randomUUID(),
        team_id: sourcingTeam.team_id,
        user_id: joyal.user_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        team_member_id: crypto.randomUUID(),
        team_id: sourcingTeam.team_id,
        user_id: praveen.user_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        team_member_id: crypto.randomUUID(),
        team_id: sourcingTeam.team_id,
        user_id: yisa.user_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        team_member_id: crypto.randomUUID(),
        team_id: sourcingTeam.team_id,
        user_id: sandip.user_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        team_member_id: crypto.randomUUID(),
        team_id: sourcingTeam.team_id,
        user_id: birav.user_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        team_member_id: crypto.randomUUID(),
        team_id: sourcingTeam.team_id,
        user_id: shikha.user_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        team_member_id: crypto.randomUUID(),
        team_id: sourcingTeam.team_id,
        user_id: victorEnejo.user_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        team_member_id: crypto.randomUUID(),
        team_id: sourcingTeam.team_id,
        user_id: kandarpgiri.user_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        team_member_id: crypto.randomUUID(),
        team_id: sourcingTeam.team_id,
        user_id: nisargkumar.user_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        team_member_id: crypto.randomUUID(),
        team_id: sourcingTeam.team_id,
        user_id: gurpreet.user_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },

      {
        team_member_id: crypto.randomUUID(),
        team_id: underwriterTeam.team_id,
        user_id: miswa.user_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        team_member_id: crypto.randomUUID(),
        team_id: underwriterTeam.team_id,
        user_id: tyler.user_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        team_member_id: crypto.randomUUID(),
        team_id: underwriterTeam.team_id,
        user_id: sherrice.user_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        team_member_id: crypto.randomUUID(),
        team_id: underwriterTeam.team_id,
        user_id: shahid.user_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        team_member_id: crypto.randomUUID(),
        team_id: underwriterTeam.team_id,
        user_id: rajavardhan.user_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        team_member_id: crypto.randomUUID(),
        team_id: underwriterTeam.team_id,
        user_id: aakash.user_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        team_member_id: crypto.randomUUID(),
        team_id: underwriterTeam.team_id,
        user_id: james.user_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        team_member_id: crypto.randomUUID(),
        team_id: underwriterTeam.team_id,
        user_id: emmanuel.user_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        team_member_id: crypto.randomUUID(),
        team_id: underwriterTeam.team_id,
        user_id: rutvik.user_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        team_member_id: crypto.randomUUID(),
        team_id: underwriterTeam.team_id,
        user_id: vatsal.user_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        team_member_id: crypto.randomUUID(),
        team_id: underwriterTeam.team_id,
        user_id: prabhjot.user_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },

      {
        team_member_id: crypto.randomUUID(),
        team_id: disbursalTeam.team_id,
        user_id: nirali.user_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        team_member_id: crypto.randomUUID(),
        team_id: disbursalTeam.team_id,
        user_id: vishwa.user_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        team_member_id: crypto.randomUUID(),
        team_id: disbursalTeam.team_id,
        user_id: dhruti.user_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        team_member_id: crypto.randomUUID(),
        team_id: disbursalTeam.team_id,
        user_id: rajKumar.user_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        team_member_id: crypto.randomUUID(),
        team_id: disbursalTeam.team_id,
        user_id: honey.user_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        team_member_id: crypto.randomUUID(),
        team_id: disbursalTeam.team_id,
        user_id: parminder.user_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        team_member_id: crypto.randomUUID(),
        team_id: disbursalTeam.team_id,
        user_id: christ.user_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        team_member_id: crypto.randomUUID(),
        team_id: disbursalTeam.team_id,
        user_id: ansh.user_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        team_member_id: crypto.randomUUID(),
        team_id: disbursalTeam.team_id,
        user_id: sukhjit.user_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        team_member_id: crypto.randomUUID(),
        team_id: disbursalTeam.team_id,
        user_id: teena.user_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  console.log('Team members seeded successfully.');
}

async function getRequiredApplicationStatus(statusCode: string) {
  const status = await prisma.application_status.findFirst({
    where: { status_code: statusCode },
    select: {
      status_id: true,
      status_code: true,
      status_name: true,
    },
  });

  if (!status) {
    throw new Error(`Required seeded application status not found: ${statusCode}`);
  }

  return status;
}

async function getRequiredDecisionType(decisionCode: string) {
  const decisionType = await prisma.decision_types.findFirst({
    where: { decision_code: decisionCode },
    select: {
      decision_type_id: true,
      decision_code: true,
      decision_name: true,
    },
  });

  if (!decisionType) {
    throw new Error(`Required seeded decision type not found: ${decisionCode}`);
  }

  return decisionType;
}

async function seedApplicationActionHistory() {
  console.log('Starting seed for application action history...');

  const sukh = await getRequiredUser('sukh@creditpulse.com');
  const miswa = await getRequiredUser('miswa@creditpulse.com');
  const nirali = await getRequiredUser('nirali@creditpulse.com');
  const amanCustomer = await getRequiredUser('aman.sharma@creditpulse.com');

  const app1 = await getRequiredApplication('APPL0000000001');
  const app2 = await getRequiredApplication('APPL0000000002');
  const app3 = await getRequiredApplication('APPL0000000003');
  const app4 = await getRequiredApplication('APPL0000000004');
  const app5 = await getRequiredApplication('APPL0000000005');

  const submittedStatus = await getRequiredApplicationStatus('SUBMITTED');
  const creditCheckCompletedStatus = await getRequiredApplicationStatus('CREDIT_CHECK_COMPLETED');
  const underReviewStatus = await getRequiredApplicationStatus('UNDER_REVIEW');
  const approvedStatus = await getRequiredApplicationStatus('APPROVED');
  const rejectedStatus = await getRequiredApplicationStatus('REJECTED');
  const disbursedStatus = await getRequiredApplicationStatus('DISBURSED');

  const approveDecision = await getRequiredDecisionType('APPROVE');
  const rejectDecision = await getRequiredDecisionType('REJECT');

  await prisma.application_action_history.deleteMany({
    where: {
      application_id: {
        in: [
          app1.application_id,
          app2.application_id,
          app3.application_id,
          app4.application_id,
          app5.application_id,
        ],
      },
    },
  });

  await prisma.application_action_history.createMany({
    data: [
      {
        application_id: app1.application_id,
        action_type: 'APPLICATION_SUBMITTED',
        from_status_id: null,
        to_status_id: submittedStatus.status_id,
        performed_by_user_id: amanCustomer.user_id,
        performed_at: new Date('2026-03-20T09:00:00Z'),
        performer_role_code: 'CUSTOMER',
        decision_type_id: null,
        remarks: 'Application submitted successfully by customer.',
        approved_loan_amount: null,
        approved_interest_rate: null,
        approved_tenure_months: null,
        approved_emi: null,
        disbursed_amount: null,
        metadata_json: {
          source: 'PORTAL',
          stageLabel: 'Initial submission',
        },
        created_at: new Date('2026-03-20T09:00:00Z'),
        created_by: amanCustomer.user_id,
        updated_at: new Date('2026-03-20T09:00:00Z'),
        updated_by: amanCustomer.user_id,
        is_active: true,
      },

      {
        application_id: app2.application_id,
        action_type: 'APPLICATION_SUBMITTED',
        from_status_id: null,
        to_status_id: submittedStatus.status_id,
        performed_by_user_id: sukh.user_id,
        performed_at: new Date('2026-03-21T10:00:00Z'),
        performer_role_code: 'SOURCING_OFFICER',
        decision_type_id: null,
        remarks: 'Application submitted through assisted sourcing flow.',
        approved_loan_amount: null,
        approved_interest_rate: null,
        approved_tenure_months: null,
        approved_emi: null,
        disbursed_amount: null,
        metadata_json: {
          source: 'ASSISTED_ENTRY',
          stageLabel: 'Initial submission',
        },
        created_at: new Date('2026-03-21T10:00:00Z'),
        created_by: sukh.user_id,
        updated_at: new Date('2026-03-21T10:00:00Z'),
        updated_by: sukh.user_id,
        is_active: true,
      },
      {
        application_id: app2.application_id,
        action_type: 'CREDIT_CHECK_COMPLETED',
        from_status_id: submittedStatus.status_id,
        to_status_id: creditCheckCompletedStatus.status_id,
        performed_by_user_id: sukh.user_id,
        performed_at: new Date('2026-03-21T11:15:00Z'),
        performer_role_code: 'SOURCING_OFFICER',
        decision_type_id: null,
        remarks: 'Credit check completed successfully.',
        approved_loan_amount: null,
        approved_interest_rate: null,
        approved_tenure_months: null,
        approved_emi: null,
        disbursed_amount: null,
        metadata_json: {
          bureauStatus: 'SUCCESS',
          scoreBand: '700-749',
        },
        created_at: new Date('2026-03-21T11:15:00Z'),
        created_by: sukh.user_id,
        updated_at: new Date('2026-03-21T11:15:00Z'),
        updated_by: sukh.user_id,
        is_active: true,
      },
      {
        application_id: app2.application_id,
        action_type: 'MOVED_TO_UNDER_REVIEW',
        from_status_id: creditCheckCompletedStatus.status_id,
        to_status_id: underReviewStatus.status_id,
        performed_by_user_id: sukh.user_id,
        performed_at: new Date('2026-03-21T12:00:00Z'),
        performer_role_code: 'SOURCING_OFFICER',
        decision_type_id: null,
        remarks: 'Application moved to underwriter queue.',
        approved_loan_amount: null,
        approved_interest_rate: null,
        approved_tenure_months: null,
        approved_emi: null,
        disbursed_amount: null,
        metadata_json: {
          queue: 'UNDERWRITER_TEAM',
        },
        created_at: new Date('2026-03-21T12:00:00Z'),
        created_by: sukh.user_id,
        updated_at: new Date('2026-03-21T12:00:00Z'),
        updated_by: sukh.user_id,
        is_active: true,
      },

      {
        application_id: app3.application_id,
        action_type: 'APPLICATION_SUBMITTED',
        from_status_id: null,
        to_status_id: submittedStatus.status_id,
        performed_by_user_id: sukh.user_id,
        performed_at: new Date('2026-03-22T09:30:00Z'),
        performer_role_code: 'SOURCING_OFFICER',
        decision_type_id: null,
        remarks: 'Application submitted through assisted sourcing flow.',
        approved_loan_amount: null,
        approved_interest_rate: null,
        approved_tenure_months: null,
        approved_emi: null,
        disbursed_amount: null,
        metadata_json: {
          source: 'ASSISTED_ENTRY',
        },
        created_at: new Date('2026-03-22T09:30:00Z'),
        created_by: sukh.user_id,
        updated_at: new Date('2026-03-22T09:30:00Z'),
        updated_by: sukh.user_id,
        is_active: true,
      },
      {
        application_id: app3.application_id,
        action_type: 'CREDIT_CHECK_COMPLETED',
        from_status_id: submittedStatus.status_id,
        to_status_id: creditCheckCompletedStatus.status_id,
        performed_by_user_id: sukh.user_id,
        performed_at: new Date('2026-03-22T10:15:00Z'),
        performer_role_code: 'SOURCING_OFFICER',
        decision_type_id: null,
        remarks: 'Credit check completed successfully.',
        approved_loan_amount: null,
        approved_interest_rate: null,
        approved_tenure_months: null,
        approved_emi: null,
        disbursed_amount: null,
        metadata_json: {
          bureauStatus: 'SUCCESS',
          riskLevel: 'LOW',
        },
        created_at: new Date('2026-03-22T10:15:00Z'),
        created_by: sukh.user_id,
        updated_at: new Date('2026-03-22T10:15:00Z'),
        updated_by: sukh.user_id,
        is_active: true,
      },
      {
        application_id: app3.application_id,
        action_type: 'MOVED_TO_UNDER_REVIEW',
        from_status_id: creditCheckCompletedStatus.status_id,
        to_status_id: underReviewStatus.status_id,
        performed_by_user_id: sukh.user_id,
        performed_at: new Date('2026-03-22T11:00:00Z'),
        performer_role_code: 'SOURCING_OFFICER',
        decision_type_id: null,
        remarks: 'Application moved to underwriter queue.',
        approved_loan_amount: null,
        approved_interest_rate: null,
        approved_tenure_months: null,
        approved_emi: null,
        disbursed_amount: null,
        metadata_json: {
          queue: 'UNDERWRITER_TEAM',
        },
        created_at: new Date('2026-03-22T11:00:00Z'),
        created_by: sukh.user_id,
        updated_at: new Date('2026-03-22T11:00:00Z'),
        updated_by: sukh.user_id,
        is_active: true,
      },
      {
        application_id: app3.application_id,
        action_type: 'UNDERWRITER_APPROVED',
        from_status_id: underReviewStatus.status_id,
        to_status_id: approvedStatus.status_id,
        performed_by_user_id: miswa.user_id,
        performed_at: new Date('2026-03-22T14:00:00Z'),
        performer_role_code: 'UNDERWRITER',
        decision_type_id: approveDecision.decision_type_id,
        remarks: 'Application approved after underwriting review.',
        approved_loan_amount: '50000.00',
        approved_interest_rate: '11.75',
        approved_tenure_months: 18,
        approved_emi: '3043.30',
        disbursed_amount: null,
        metadata_json: {
          affordability: 'PASS',
          riskLevel: 'LOW',
        },
        created_at: new Date('2026-03-22T14:00:00Z'),
        created_by: miswa.user_id,
        updated_at: new Date('2026-03-22T14:00:00Z'),
        updated_by: miswa.user_id,
        is_active: true,
      },

      {
        application_id: app4.application_id,
        action_type: 'APPLICATION_SUBMITTED',
        from_status_id: null,
        to_status_id: submittedStatus.status_id,
        performed_by_user_id: sukh.user_id,
        performed_at: new Date('2026-03-18T08:45:00Z'),
        performer_role_code: 'SOURCING_OFFICER',
        decision_type_id: null,
        remarks: 'Application submitted through assisted sourcing flow.',
        approved_loan_amount: null,
        approved_interest_rate: null,
        approved_tenure_months: null,
        approved_emi: null,
        disbursed_amount: null,
        metadata_json: {
          source: 'ASSISTED_ENTRY',
        },
        created_at: new Date('2026-03-18T08:45:00Z'),
        created_by: sukh.user_id,
        updated_at: new Date('2026-03-18T08:45:00Z'),
        updated_by: sukh.user_id,
        is_active: true,
      },
      {
        application_id: app4.application_id,
        action_type: 'CREDIT_CHECK_COMPLETED',
        from_status_id: submittedStatus.status_id,
        to_status_id: creditCheckCompletedStatus.status_id,
        performed_by_user_id: sukh.user_id,
        performed_at: new Date('2026-03-18T09:20:00Z'),
        performer_role_code: 'SOURCING_OFFICER',
        decision_type_id: null,
        remarks: 'Credit check completed successfully.',
        approved_loan_amount: null,
        approved_interest_rate: null,
        approved_tenure_months: null,
        approved_emi: null,
        disbursed_amount: null,
        metadata_json: {
          bureauStatus: 'SUCCESS',
          riskLevel: 'VERY_LOW',
        },
        created_at: new Date('2026-03-18T09:20:00Z'),
        created_by: sukh.user_id,
        updated_at: new Date('2026-03-18T09:20:00Z'),
        updated_by: sukh.user_id,
        is_active: true,
      },
      {
        application_id: app4.application_id,
        action_type: 'MOVED_TO_UNDER_REVIEW',
        from_status_id: creditCheckCompletedStatus.status_id,
        to_status_id: underReviewStatus.status_id,
        performed_by_user_id: sukh.user_id,
        performed_at: new Date('2026-03-18T10:00:00Z'),
        performer_role_code: 'SOURCING_OFFICER',
        decision_type_id: null,
        remarks: 'Application moved to underwriter queue.',
        approved_loan_amount: null,
        approved_interest_rate: null,
        approved_tenure_months: null,
        approved_emi: null,
        disbursed_amount: null,
        metadata_json: {
          queue: 'UNDERWRITER_TEAM',
        },
        created_at: new Date('2026-03-18T10:00:00Z'),
        created_by: sukh.user_id,
        updated_at: new Date('2026-03-18T10:00:00Z'),
        updated_by: sukh.user_id,
        is_active: true,
      },
      {
        application_id: app4.application_id,
        action_type: 'UNDERWRITER_APPROVED',
        from_status_id: underReviewStatus.status_id,
        to_status_id: approvedStatus.status_id,
        performed_by_user_id: miswa.user_id,
        performed_at: new Date('2026-03-18T14:10:00Z'),
        performer_role_code: 'UNDERWRITER',
        decision_type_id: approveDecision.decision_type_id,
        remarks: 'Application approved after underwriting review.',
        approved_loan_amount: '125000.00',
        approved_interest_rate: '7.95',
        approved_tenure_months: 36,
        approved_emi: '3914.16',
        disbursed_amount: null,
        metadata_json: {
          affordability: 'PASS',
          riskLevel: 'VERY_LOW',
        },
        created_at: new Date('2026-03-18T14:10:00Z'),
        created_by: miswa.user_id,
        updated_at: new Date('2026-03-18T14:10:00Z'),
        updated_by: miswa.user_id,
        is_active: true,
      },
      {
        application_id: app4.application_id,
        action_type: 'DISBURSAL_COMPLETED',
        from_status_id: approvedStatus.status_id,
        to_status_id: disbursedStatus.status_id,
        performed_by_user_id: nirali.user_id,
        performed_at: new Date('2026-03-19T10:30:00Z'),
        performer_role_code: 'DISBURSAL_OFFICER',
        decision_type_id: null,
        remarks: 'Loan amount disbursed successfully.',
        approved_loan_amount: null,
        approved_interest_rate: null,
        approved_tenure_months: null,
        approved_emi: null,
        disbursed_amount: '125000.00',
        metadata_json: {
          transferReference: 'DISB-CP-20260319-0004',
          payoutStatus: 'SUCCESS',
        },
        created_at: new Date('2026-03-19T10:30:00Z'),
        created_by: nirali.user_id,
        updated_at: new Date('2026-03-19T10:30:00Z'),
        updated_by: nirali.user_id,
        is_active: true,
      },

      {
        application_id: app5.application_id,
        action_type: 'APPLICATION_SUBMITTED',
        from_status_id: null,
        to_status_id: submittedStatus.status_id,
        performed_by_user_id: amanCustomer.user_id,
        performed_at: new Date('2026-03-23T08:30:00Z'),
        performer_role_code: 'CUSTOMER',
        decision_type_id: null,
        remarks: 'Application submitted successfully by customer.',
        approved_loan_amount: null,
        approved_interest_rate: null,
        approved_tenure_months: null,
        approved_emi: null,
        disbursed_amount: null,
        metadata_json: {
          source: 'PORTAL',
        },
        created_at: new Date('2026-03-23T08:30:00Z'),
        created_by: amanCustomer.user_id,
        updated_at: new Date('2026-03-23T08:30:00Z'),
        updated_by: amanCustomer.user_id,
        is_active: true,
      },
      {
        application_id: app5.application_id,
        action_type: 'CREDIT_CHECK_COMPLETED',
        from_status_id: submittedStatus.status_id,
        to_status_id: creditCheckCompletedStatus.status_id,
        performed_by_user_id: sukh.user_id,
        performed_at: new Date('2026-03-23T09:20:00Z'),
        performer_role_code: 'SOURCING_OFFICER',
        decision_type_id: null,
        remarks: 'Credit check completed successfully.',
        approved_loan_amount: null,
        approved_interest_rate: null,
        approved_tenure_months: null,
        approved_emi: null,
        disbursed_amount: null,
        metadata_json: {
          bureauStatus: 'SUCCESS',
          riskLevel: 'HIGH',
        },
        created_at: new Date('2026-03-23T09:20:00Z'),
        created_by: sukh.user_id,
        updated_at: new Date('2026-03-23T09:20:00Z'),
        updated_by: sukh.user_id,
        is_active: true,
      },
      {
        application_id: app5.application_id,
        action_type: 'MOVED_TO_UNDER_REVIEW',
        from_status_id: creditCheckCompletedStatus.status_id,
        to_status_id: underReviewStatus.status_id,
        performed_by_user_id: sukh.user_id,
        performed_at: new Date('2026-03-23T10:00:00Z'),
        performer_role_code: 'SOURCING_OFFICER',
        decision_type_id: null,
        remarks: 'Application moved to underwriter queue.',
        approved_loan_amount: null,
        approved_interest_rate: null,
        approved_tenure_months: null,
        approved_emi: null,
        disbursed_amount: null,
        metadata_json: {
          queue: 'UNDERWRITER_TEAM',
        },
        created_at: new Date('2026-03-23T10:00:00Z'),
        created_by: sukh.user_id,
        updated_at: new Date('2026-03-23T10:00:00Z'),
        updated_by: sukh.user_id,
        is_active: true,
      },
      {
        application_id: app5.application_id,
        action_type: 'UNDERWRITER_REJECTED',
        from_status_id: underReviewStatus.status_id,
        to_status_id: rejectedStatus.status_id,
        performed_by_user_id: miswa.user_id,
        performed_at: new Date('2026-03-23T14:00:00Z'),
        performer_role_code: 'UNDERWRITER',
        decision_type_id: rejectDecision.decision_type_id,
        remarks: 'Application rejected after underwriting review.',
        approved_loan_amount: null,
        approved_interest_rate: null,
        approved_tenure_months: null,
        approved_emi: null,
        disbursed_amount: null,
        metadata_json: {
          rejectionReason: 'High risk and weak affordability profile',
        },
        created_at: new Date('2026-03-23T14:00:00Z'),
        created_by: miswa.user_id,
        updated_at: new Date('2026-03-23T14:00:00Z'),
        updated_by: miswa.user_id,
        is_active: true,
      },
    ],
  });

  console.log('Application action history seeded successfully.');
}

async function seedApplicationAssignments() {
  console.log('Starting seed for application assignments...');

  const sukh = await getRequiredUser('sukh@creditpulse.com');
  const miswa = await getRequiredUser('miswa@creditpulse.com');
  const nirali = await getRequiredUser('nirali@creditpulse.com');

  const underwriterTeam = await prisma.teams.findFirst({
    where: { team_code: 'UNDERWRITER_TEAM' },
    select: { team_id: true, team_code: true },
  });

  const disbursalTeam = await prisma.teams.findFirst({
    where: { team_code: 'DISBURSAL_TEAM' },
    select: { team_id: true, team_code: true },
  });

  if (!underwriterTeam || !disbursalTeam) {
    throw new Error('Required teams not found. Please run seedTeams() first.');
  }

  const app1 = await getRequiredApplication('APPL0000000001');
  const app2 = await getRequiredApplication('APPL0000000002');
  const app3 = await getRequiredApplication('APPL0000000003');
  const app4 = await getRequiredApplication('APPL0000000004');
  const app5 = await getRequiredApplication('APPL0000000005');
  const app6 = await getRequiredApplication('APPL0000000006');
  const app7 = await getRequiredApplication('APPL0000000007');
  const app8 = await getRequiredApplication('APPL0000000008');
  const app9 = await getRequiredApplication('APPL0000000009');
  const app12 = await getRequiredApplication('APPL0000000012');

  await prisma.application_assignment.deleteMany({
    where: {
      application_id: {
        in: [
          app1.application_id,
          app2.application_id,
          app3.application_id,
          app4.application_id,
          app5.application_id,
          app6.application_id,
          app7.application_id,
          app8.application_id,
          app9.application_id,
          app12.application_id,
        ],
      },
    },
  });

  await prisma.application_assignment.createMany({
    data: [
      {
        assignment_id: crypto.randomUUID(),
        application_id: app1.application_id,
        assigned_team_id: underwriterTeam.team_id,
        assigned_user_id: null,
        assignment_status: 'ACTIVE',
        assigned_at: new Date('2026-03-20T09:05:00Z'),
        assigned_by: sukh.user_id,
        unassigned_at: null,
        unassigned_by: null,
        remarks: 'Newly created application assigned to underwriter team queue.',
        is_current: true,
        is_active: true,
        created_at: new Date('2026-03-20T09:05:00Z'),
        created_by: sukh.user_id,
        updated_at: new Date('2026-03-20T09:05:00Z'),
        updated_by: sukh.user_id,
      },

      {
        assignment_id: crypto.randomUUID(),
        application_id: app2.application_id,
        assigned_team_id: underwriterTeam.team_id,
        assigned_user_id: miswa.user_id,
        assignment_status: 'ACTIVE',
        assigned_at: new Date('2026-03-21T12:00:00Z'),
        assigned_by: sukh.user_id,
        unassigned_at: null,
        unassigned_by: null,
        remarks: 'Assigned to underwriter for review.',
        is_current: true,
        is_active: true,
        created_at: new Date('2026-03-21T12:00:00Z'),
        created_by: sukh.user_id,
        updated_at: new Date('2026-03-21T12:00:00Z'),
        updated_by: sukh.user_id,
      },

      {
        assignment_id: crypto.randomUUID(),
        application_id: app3.application_id,
        assigned_team_id: underwriterTeam.team_id,
        assigned_user_id: miswa.user_id,
        assignment_status: 'COMPLETED',
        assigned_at: new Date('2026-03-22T11:00:00Z'),
        assigned_by: sukh.user_id,
        unassigned_at: new Date('2026-03-22T14:00:00Z'),
        unassigned_by: miswa.user_id,
        remarks: 'Underwriter review completed and application approved.',
        is_current: false,
        is_active: true,
        created_at: new Date('2026-03-22T11:00:00Z'),
        created_by: sukh.user_id,
        updated_at: new Date('2026-03-22T14:00:00Z'),
        updated_by: miswa.user_id,
      },
      {
        assignment_id: crypto.randomUUID(),
        application_id: app3.application_id,
        assigned_team_id: disbursalTeam.team_id,
        assigned_user_id: nirali.user_id,
        assignment_status: 'ACTIVE',
        assigned_at: new Date('2026-03-22T14:05:00Z'),
        assigned_by: miswa.user_id,
        unassigned_at: null,
        unassigned_by: null,
        remarks: 'Moved to disbursal after underwriting approval.',
        is_current: true,
        is_active: true,
        created_at: new Date('2026-03-22T14:05:00Z'),
        created_by: miswa.user_id,
        updated_at: new Date('2026-03-22T14:05:00Z'),
        updated_by: miswa.user_id,
      },

      {
        assignment_id: crypto.randomUUID(),
        application_id: app4.application_id,
        assigned_team_id: underwriterTeam.team_id,
        assigned_user_id: miswa.user_id,
        assignment_status: 'COMPLETED',
        assigned_at: new Date('2026-03-18T10:00:00Z'),
        assigned_by: sukh.user_id,
        unassigned_at: new Date('2026-03-18T14:10:00Z'),
        unassigned_by: miswa.user_id,
        remarks: 'Underwriter approved mortgage application.',
        is_current: false,
        is_active: true,
        created_at: new Date('2026-03-18T10:00:00Z'),
        created_by: sukh.user_id,
        updated_at: new Date('2026-03-18T14:10:00Z'),
        updated_by: miswa.user_id,
      },
      {
        assignment_id: crypto.randomUUID(),
        application_id: app4.application_id,
        assigned_team_id: disbursalTeam.team_id,
        assigned_user_id: nirali.user_id,
        assignment_status: 'COMPLETED',
        assigned_at: new Date('2026-03-18T14:15:00Z'),
        assigned_by: miswa.user_id,
        unassigned_at: new Date('2026-03-19T10:30:00Z'),
        unassigned_by: nirali.user_id,
        remarks: 'Disbursal completed successfully.',
        is_current: false,
        is_active: true,
        created_at: new Date('2026-03-18T14:15:00Z'),
        created_by: miswa.user_id,
        updated_at: new Date('2026-03-19T10:30:00Z'),
        updated_by: nirali.user_id,
      },

      {
        assignment_id: crypto.randomUUID(),
        application_id: app5.application_id,
        assigned_team_id: underwriterTeam.team_id,
        assigned_user_id: miswa.user_id,
        assignment_status: 'COMPLETED',
        assigned_at: new Date('2026-03-23T10:00:00Z'),
        assigned_by: sukh.user_id,
        unassigned_at: new Date('2026-03-23T14:00:00Z'),
        unassigned_by: miswa.user_id,
        remarks: 'Underwriter rejected application.',
        is_current: false,
        is_active: true,
        created_at: new Date('2026-03-23T10:00:00Z'),
        created_by: sukh.user_id,
        updated_at: new Date('2026-03-23T14:00:00Z'),
        updated_by: miswa.user_id,
      },

      {
        assignment_id: crypto.randomUUID(),
        application_id: app6.application_id,
        assigned_team_id: underwriterTeam.team_id,
        assigned_user_id: null,
        assignment_status: 'ACTIVE',
        assigned_at: new Date('2026-03-23T09:10:00Z'),
        assigned_by: sukh.user_id,
        unassigned_at: null,
        unassigned_by: null,
        remarks: 'Application routed to underwriter team queue.',
        is_current: true,
        is_active: true,
        created_at: new Date('2026-03-23T09:10:00Z'),
        created_by: sukh.user_id,
        updated_at: new Date('2026-03-23T09:10:00Z'),
        updated_by: sukh.user_id,
      },

      {
        assignment_id: crypto.randomUUID(),
        application_id: app7.application_id,
        assigned_team_id: underwriterTeam.team_id,
        assigned_user_id: miswa.user_id,
        assignment_status: 'ACTIVE',
        assigned_at: new Date('2026-03-24T08:30:00Z'),
        assigned_by: sukh.user_id,
        unassigned_at: null,
        unassigned_by: null,
        remarks: 'Assigned to underwriter for active review.',
        is_current: true,
        is_active: true,
        created_at: new Date('2026-03-24T08:30:00Z'),
        created_by: sukh.user_id,
        updated_at: new Date('2026-03-24T08:30:00Z'),
        updated_by: sukh.user_id,
      },

      {
        assignment_id: crypto.randomUUID(),
        application_id: app8.application_id,
        assigned_team_id: disbursalTeam.team_id,
        assigned_user_id: nirali.user_id,
        assignment_status: 'ACTIVE',
        assigned_at: new Date('2026-03-24T11:00:00Z'),
        assigned_by: miswa.user_id,
        unassigned_at: null,
        unassigned_by: null,
        remarks: 'Approved application moved to disbursal team.',
        is_current: true,
        is_active: true,
        created_at: new Date('2026-03-24T11:00:00Z'),
        created_by: miswa.user_id,
        updated_at: new Date('2026-03-24T11:00:00Z'),
        updated_by: miswa.user_id,
      },

      {
        assignment_id: crypto.randomUUID(),
        application_id: app9.application_id,
        assigned_team_id: underwriterTeam.team_id,
        assigned_user_id: miswa.user_id,
        assignment_status: 'COMPLETED',
        assigned_at: new Date('2026-03-17T10:00:00Z'),
        assigned_by: sukh.user_id,
        unassigned_at: new Date('2026-03-18T09:00:00Z'),
        unassigned_by: miswa.user_id,
        remarks: 'Underwriter approved business loan.',
        is_current: false,
        is_active: true,
        created_at: new Date('2026-03-17T10:00:00Z'),
        created_by: sukh.user_id,
        updated_at: new Date('2026-03-18T09:00:00Z'),
        updated_by: miswa.user_id,
      },
      {
        assignment_id: crypto.randomUUID(),
        application_id: app9.application_id,
        assigned_team_id: disbursalTeam.team_id,
        assigned_user_id: nirali.user_id,
        assignment_status: 'COMPLETED',
        assigned_at: new Date('2026-03-18T09:05:00Z'),
        assigned_by: miswa.user_id,
        unassigned_at: new Date('2026-03-19T12:30:00Z'),
        unassigned_by: nirali.user_id,
        remarks: 'Disbursal completed and case closed.',
        is_current: false,
        is_active: true,
        created_at: new Date('2026-03-18T09:05:00Z'),
        created_by: miswa.user_id,
        updated_at: new Date('2026-03-19T12:30:00Z'),
        updated_by: nirali.user_id,
      },

      {
        assignment_id: crypto.randomUUID(),
        application_id: app12.application_id,
        assigned_team_id: underwriterTeam.team_id,
        assigned_user_id: null,
        assignment_status: 'ACTIVE',
        assigned_at: new Date('2026-03-25T09:45:00Z'),
        assigned_by: sukh.user_id,
        unassigned_at: null,
        unassigned_by: null,
        remarks: 'Mortgage application pending underwriter pickup.',
        is_current: true,
        is_active: true,
        created_at: new Date('2026-03-25T09:45:00Z'),
        created_by: sukh.user_id,
        updated_at: new Date('2026-03-25T09:45:00Z'),
        updated_by: sukh.user_id,
      },
    ],
  });

  console.log('Application assignments seeded successfully.');
}

async function main() {
  await seedBase();
  await seedSupplemental();
  await seedTeams();
  await seedTeamMembers();
  await seedApplicationAssignments();
  await seedApplicationActionHistory();
  await seedApplicationCommunication();
  await seedEligibilityEngine();

  console.log('System users:');

  console.log('Victor  -> victor@creditpulse.com /  Victor@19880412.1001');
  console.log('Miswa   -> miswa@creditpulse.com / Miswa@19910918.1003');
  console.log('Nirali  -> nirali@creditpulse.com / Nirali@19990810.1004');
  console.log('Sukh    -> sukh@creditpulse.com / Sukh@19981222.1002');
  console.log('Aman    -> aman@creditpulse.com / Aman@19970214.1005');

  console.log('Sourcing Officers:');

  console.log('Joyal  -> joyal.aji@creditpulse.com / Sukh@19981222.1002');
  console.log('Praveen  -> praveen.bangla@creditpulse.com / Sukh@19981222.1002');
  console.log('Yisa  -> yisa.bankole@creditpulse.com / Sukh@19981222.1002');
  console.log('Sandip  -> sandip.bharati@creditpulse.com / Sukh@19981222.1002');
  console.log('Birav  -> birav.bhattrai@creditpulse.com / Sukh@19981222.1002');
  console.log('Shikha  -> shikha.desai@creditpulse.com / Sukh@19981222.1002');
  console.log('Victor Enejo  -> victor.enejo@creditpulse.com / Sukh@19981222.1002');
  console.log('Kandarpgiri  -> kandarpgiri.gosai@creditpulse.com / Sukh@19981222.1002');
  console.log('Nisargkumar  -> nisargkumar.goswami@creditpulse.com / Sukh@19981222.1002');
  console.log('Gurpreet  -> gurpreet.singh@creditpulse.com / Sukh@19981222.1002');

  console.log('Underwriters:');

  console.log('Tyler  -> tyler.kobe@creditpulse.com / Miswa@19910918.1003');
  console.log('Sherrice  -> sherrice.lyons@creditpulse.com / Miswa@19910918.1003');
  console.log('Shahid  -> shahid.mahammed@creditpulse.com / Miswa@19910918.1003');
  console.log('Rajavardhan  -> rajavardhan.reddy@creditpulse.com / Miswa@19910918.1003');
  console.log('Aakash  -> aakash.nair@creditpulse.com / Miswa@19910918.1003');
  console.log('James  -> james.okeke@creditpulse.com / Miswa@19910918.1003');
  console.log('Emmanuel  -> emmanuel.raji@creditpulse.com / Miswa@19910918.1003');
  console.log('Rutvik  -> rutvik.patel@creditpulse.com / Miswa@19910918.1003');
  console.log('Vatsal  -> vatsal.patel@creditpulse.com / Miswa@19910918.1003');
  console.log('Prabhjot  -> prabhjot.singh@creditpulse.com / Miswa@19910918.1003');

  console.log('Disbursal Officers:');

  console.log('Vishwa  -> vishwa.rana@creditpulse.com / Nirali@19990810.1004');
  console.log('Dhruti  -> dhruti.rathod@creditpulse.com / Nirali@19990810.1004');
  console.log('Raj Kumar  -> raj.kumar@creditpulse.com / Nirali@19990810.1004');
  console.log('Honey  -> honey.singh@creditpulse.com / Nirali@19990810.1004');
  console.log('Parminder  -> parminder.singh@creditpulse.com / Nirali@19990810.1004');
  console.log('Christ  -> christ.vijay@creditpulse.com / Nirali@19990810.1004');
  console.log('Ansh  -> ansh.sukhija@creditpulse.com / Nirali@19990810.1004');
  console.log('Sukhjit  -> sukhjit.kaur@creditpulse.com / Nirali@19990810.1004');
  console.log('Teena  -> teena.thomas@creditpulse.com / Nirali@19990810.1004');
  console.log('Merged seed completed successfully.');
}

main()
  .catch((error) => {
    console.error('Merged seed failed.', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
