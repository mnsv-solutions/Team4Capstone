import { PrismaPg } from '@prisma/adapter-pg';

import * as bcrypt from 'bcrypt';

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

async function main() {
  console.log('Starting seed...');

  const victorPassword = await bcrypt.hash('Victor@123', 10);
  const miswaPassword = await bcrypt.hash('Miswa@123', 10);
  const niraliPassword = await bcrypt.hash('Nirali@123', 10);
  const sukhPassword = await bcrypt.hash('Sukh@123', 10);

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
  await prisma.loan_application.deleteMany();
  await prisma.application_status_audit.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user_employment.deleteMany();
  await prisma.user_education.deleteMany();
  await prisma.user_bank_account.deleteMany();
  await prisma.user_address.deleteMany();
  await prisma.user_profile.deleteMany();
  await prisma.loan_types.updateMany({ data: { created_by: null, updated_by: null } });
  await prisma.institutions.updateMany({ data: { created_by: null, updated_by: null } });
  await prisma.employment_types.updateMany({ data: { created_by: null, updated_by: null } });
  await prisma.education_levels.updateMany({ data: { created_by: null, updated_by: null } });
  await prisma.decision_types.updateMany({ data: { created_by: null, updated_by: null } });
  await prisma.banks.updateMany({ data: { created_by: null, updated_by: null } });
  await prisma.application_status.updateMany({ data: { created_by: null, updated_by: null } });
  await prisma.address_types.updateMany({ data: { created_by: null, updated_by: null } });
  await prisma.roles.updateMany({ data: { created_by: null, updated_by: null } });
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

  const roleAnalyst = await prisma.roles.create({
    data: {
      role_code: 'ANALYST',
      role_name: 'Credit Analyst',
      is_active: true,
    },
  });

  const roleOps = await prisma.roles.create({
    data: {
      role_code: 'OPS',
      role_name: 'Operations Officer',
      is_active: true,
    },
  });

  const victor = await prisma.users.create({
    data: {
      role_id: roleAdmin.role_id,
      first_name: 'Victor',
      last_name: 'Admin',
      email: 'victor@creditpulse.com',
      password_hash: victorPassword,
      phone: '+1-519-555-1001',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const miswa = await prisma.users.create({
    data: {
      role_id: roleAnalyst.role_id,
      first_name: 'Miswa',
      last_name: 'Analyst',
      email: 'miswa@creditpulse.com',
      password_hash: miswaPassword,
      phone: '+1-519-555-1002',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const nirali = await prisma.users.create({
    data: {
      role_id: roleAnalyst.role_id,
      first_name: 'Nirali',
      last_name: 'Patel',
      email: 'nirali@creditpulse.com',
      password_hash: niraliPassword,
      phone: '+1-519-555-1003',
      is_email_verified: true,
      is_system_user: true,
      is_active: true,
    },
  });

  const sukh = await prisma.users.create({
    data: {
      role_id: roleOps.role_id,
      first_name: 'Sukh',
      last_name: 'Bhambra',
      email: 'sukh@creditpulse.com',
      password_hash: sukhPassword,
      phone: '+1-519-555-1004',
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

  await prisma.user_profile.createMany({
    data: [
      {
        user_id: victor.user_id,
        date_of_birth: new Date('1988-04-12'),
        gender: 'Male',
        marital_status: 'Married',
        nationality: 'Canadian',
        government_id_type: 'SIN',
        government_id_number: '900000001',
        created_by: createdBy,
        updated_by: updatedBy,
        is_active: true,
      },
      {
        user_id: miswa.user_id,
        date_of_birth: new Date('1991-09-18'),
        gender: 'Female',
        marital_status: 'Single',
        nationality: 'Canadian',
        government_id_type: 'SIN',
        government_id_number: '900000002',
        created_by: createdBy,
        updated_by: updatedBy,
        is_active: true,
      },
      {
        user_id: nirali.user_id,
        date_of_birth: new Date('1999-08-10'),
        gender: 'Female',
        marital_status: 'Single',
        nationality: 'Indian',
        government_id_type: 'SIN',
        government_id_number: '900000003',
        created_by: createdBy,
        updated_by: updatedBy,
        is_active: true,
      },
      {
        user_id: sukh.user_id,
        date_of_birth: new Date('1998-12-22'),
        gender: 'Male',
        marital_status: 'Single',
        nationality: 'Indian',
        government_id_type: 'SIN',
        government_id_number: '900000004',
        created_by: createdBy,
        updated_by: updatedBy,
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
        applicant_type: 1,
        created_by: nirali.user_id,
        updated_by: nirali.user_id,
        is_active: true,
      },
      {
        application_id: app2.application_id,
        customer_id: customer2.customer_id,
        applicant_type: 1,
        created_by: miswa.user_id,
        updated_by: miswa.user_id,
        is_active: true,
      },
      {
        application_id: app3.application_id,
        customer_id: customer3.customer_id,
        applicant_type: 1,
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        application_id: app4.application_id,
        customer_id: customer4.customer_id,
        applicant_type: 1,
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        application_id: app4.application_id,
        customer_id: customer2.customer_id,
        applicant_type: 2,
        created_by: victor.user_id,
        updated_by: victor.user_id,
        is_active: true,
      },
      {
        application_id: app5.application_id,
        customer_id: customer1.customer_id,
        applicant_type: 1,
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
            applicant_type: 1,
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
        sin_number: '900000101',
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
        sin_number: '900000102',
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
        sin_number: '900000103',
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
        sin_number: '900000104',
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
        sin_number: '900000105',
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
        sin_number: '900000106',
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
        sin_number: '900000107',
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
        sin_number: '900000108',
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
        sin_number: '900000109',
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
        sin_number: '900000110',
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
  console.log('System users:');
  console.log('Victor  -> victor@creditpulse.com / Victor@123');
  console.log('Miswa   -> miswa@creditpulse.com / Miswa@123');
  console.log('Nirali  -> nirali@creditpulse.com / Nirali@123');
  console.log('Sukh    -> sukh@creditpulse.com / Sukh@123');
}

main()
  .catch((error) => {
    console.error('Seed failed.', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
