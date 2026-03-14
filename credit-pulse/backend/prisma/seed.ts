import { PrismaPg } from '@prisma/adapter-pg';

import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';

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

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


function addMonths(date: Date, months: number) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function round2(value: number) {
  return Number(value.toFixed(2))
}

function buildRepaymentSchedule(
  applicationId: string,
  principal: number,
  annualRate: number,
  tenureMonths: number,
  startDate: Date,
  createdBy?: string,
) {
  const monthlyRate = annualRate / 12 / 100
  const emi =
    monthlyRate === 0
      ? principal / tenureMonths
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1)

  let openingBalance = principal

  return Array.from({ length: tenureMonths }, (_, index) => {
    const installmentNumber = index + 1
    const interestComponent = round2(openingBalance * monthlyRate)
    const principalComponent = round2(emi - interestComponent)
    const installmentAmount = round2(principalComponent + interestComponent)
    const closingBalance =
      installmentNumber === tenureMonths
        ? 0
        : round2(openingBalance - principalComponent)

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
    }

    openingBalance = closingBalance
    return row
  })
}

async function main() {
  console.log('Starting seed...')

  const victorPassword = await bcrypt.hash('Victor@123', 10)
  const miswaPassword = await bcrypt.hash('Miswa@123', 10)
  const niraliPassword = await bcrypt.hash('Nirali@123', 10)
  const sukhPassword = await bcrypt.hash('Sukh@123', 10)

  await prisma.loan_payment.deleteMany()
  await prisma.repayment_schedule.deleteMany()
  await prisma.sub_loan.deleteMany()
  await prisma.loan_application.deleteMany()
  await prisma.application_status_audit.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.user_employment.deleteMany()
  await prisma.user_education.deleteMany()
  await prisma.user_bank_account.deleteMany()
  await prisma.user_address.deleteMany()
  await prisma.user_profile.deleteMany()
  await prisma.users.deleteMany()
  await prisma.loan_types.deleteMany()
  await prisma.institutions.deleteMany()
  await prisma.employment_types.deleteMany()
  await prisma.education_levels.deleteMany()
  await prisma.decision_types.deleteMany()
  await prisma.banks.deleteMany()
  await prisma.application_status.deleteMany()
  await prisma.address_types.deleteMany()
  await prisma.roles.deleteMany()

  const roleAdmin = await prisma.roles.create({
    data: {
      role_code: 'ADMIN',
      role_name: 'Administrator',
      is_active: true,
    },
  })

  const roleAnalyst = await prisma.roles.create({
    data: {
      role_code: 'ANALYST',
      role_name: 'Credit Analyst',
      is_active: true,
    },
  })

  const roleOps = await prisma.roles.create({
    data: {
      role_code: 'OPS',
      role_name: 'Operations Officer',
      is_active: true,
    },
  })

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
  })

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
  })

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
  })

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
  })

  const createdBy = victor.user_id
  const updatedBy = victor.user_id

  await prisma.roles.updateMany({
    data: {
      created_by: createdBy,
      updated_by: updatedBy,
    },
  })

  const homeAddressType = await prisma.address_types.create({
    data: {
      address_type_code: 'HOME',
      address_type_name: 'Home Address',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  })

  const workAddressType = await prisma.address_types.create({
    data: {
      address_type_code: 'WORK',
      address_type_name: 'Work Address',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  })

  const submittedStatus = await prisma.application_status.create({
    data: {
      status_code: 'SUBMITTED',
      status_name: 'Submitted',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  })

  const underReviewStatus = await prisma.application_status.create({
    data: {
      status_code: 'UNDER_REVIEW',
      status_name: 'Under Review',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  })

  const approvedStatus = await prisma.application_status.create({
    data: {
      status_code: 'APPROVED',
      status_name: 'Approved',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  })

  const rejectedStatus = await prisma.application_status.create({
    data: {
      status_code: 'REJECTED',
      status_name: 'Rejected',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  })

  const disbursedStatus = await prisma.application_status.create({
    data: {
      status_code: 'DISBURSED',
      status_name: 'Disbursed',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  })

  const bank1 = await prisma.banks.create({
    data: {
      bank_code: 'RBC',
      bank_name: 'Royal Bank of Canada',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  })

  const bank2 = await prisma.banks.create({
    data: {
      bank_code: 'TD',
      bank_name: 'Toronto-Dominion Bank',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  })

  const bank3 = await prisma.banks.create({
    data: {
      bank_code: 'CIBC',
      bank_name: 'Canadian Imperial Bank of Commerce',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  })

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
  })

  const eduBachelors = await prisma.education_levels.create({
    data: {
      level_code: 'BACHELORS',
      level_name: 'Bachelors',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  })

  const eduMasters = await prisma.education_levels.create({
    data: {
      level_code: 'MASTERS',
      level_name: 'Masters',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  })

  const employmentFullTime = await prisma.employment_types.create({
    data: {
      employment_type_code: 'FULL_TIME',
      employment_type_name: 'Full Time',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  })

  const employmentPartTime = await prisma.employment_types.create({
    data: {
      employment_type_code: 'PART_TIME',
      employment_type_name: 'Part Time',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  })

  const institution1 = await prisma.institutions.create({
    data: {
      institution_name: 'Conestoga College',
      city: 'Kitchener',
      country: 'Canada',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  })

  const institution2 = await prisma.institutions.create({
    data: {
      institution_name: 'University of Toronto',
      city: 'Toronto',
      country: 'Canada',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  })

  const institution3 = await prisma.institutions.create({
    data: {
      institution_name: 'McMaster University',
      city: 'Hamilton',
      country: 'Canada',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  })

  const personalLoanType = await prisma.loan_types.create({
    data: {
      loan_type_code: 'PERSONAL',
      loan_type_name: 'Personal Loan',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  })

  const educationLoanType = await prisma.loan_types.create({
    data: {
      loan_type_code: 'EDUCATION',
      loan_type_name: 'Education Loan',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  })

  const businessLoanType = await prisma.loan_types.create({
    data: {
      loan_type_code: 'BUSINESS',
      loan_type_name: 'Business Loan',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  })

  const mortgageLoanType = await prisma.loan_types.create({
    data: {
      loan_type_code: 'MORTGAGE',
      loan_type_name: 'Mortgage Loan',
      created_by: createdBy,
      updated_by: updatedBy,
      is_active: true,
    },
  })

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
  })

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
  })

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
  })

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
  })

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
  })

  const customer1 = await prisma.customer.create({
    data: {
      first_name: 'Aman',
      last_name: 'Sharma',
      date_of_birth: new Date('1997-02-14'),
      created_by: nirali.user_id,
      updated_by: nirali.user_id,
      is_active: true,
    },
  })

  const customer2 = await prisma.customer.create({
    data: {
      first_name: 'Priya',
      last_name: 'Verma',
      date_of_birth: new Date('1995-11-03'),
      created_by: sukh.user_id,
      updated_by: sukh.user_id,
      is_active: true,
    },
  })

  const customer3 = await prisma.customer.create({
    data: {
      first_name: 'Rahul',
      last_name: 'Singh',
      date_of_birth: new Date('1992-07-28'),
      created_by: miswa.user_id,
      updated_by: miswa.user_id,
      is_active: true,
    },
  })

  const customer4 = await prisma.customer.create({
    data: {
      first_name: 'Simran',
      last_name: 'Kaur',
      date_of_birth: new Date('2000-05-19'),
      created_by: nirali.user_id,
      updated_by: nirali.user_id,
      is_active: true,
    },
  })

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
  })

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
  })

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
  })

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
  })

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
  })

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
    ],
  })

  const app3SchedulesData = buildRepaymentSchedule(
    app3.application_id,
    50000,
    11.75,
    18,
    new Date('2026-04-01'),
    victor.user_id,
  )

  const app4SchedulesData = buildRepaymentSchedule(
    app4.application_id,
    125000,
    7.95,
    36,
    new Date('2026-03-15'),
    victor.user_id,
  )

  await prisma.repayment_schedule.createMany({
    data: [...app3SchedulesData, ...app4SchedulesData],
  })

  const app3Schedules = await prisma.repayment_schedule.findMany({
    where: { application_id: app3.application_id },
    orderBy: { installment_number: 'asc' },
  })

  const app4Schedules = await prisma.repayment_schedule.findMany({
    where: { application_id: app4.application_id },
    orderBy: { installment_number: 'asc' },
  })

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
    })

    await prisma.repayment_schedule.update({
      where: { schedule_id: app3Schedules[0].schedule_id },
      data: {
        paid_amount: app3Schedules[0].installment_amount,
        payment_status: 'PAID',
        paid_date: new Date('2026-05-01T10:30:00Z'),
        updated_by: victor.user_id,
      },
    })

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
    })

    await prisma.repayment_schedule.update({
      where: { schedule_id: app3Schedules[1].schedule_id },
      data: {
        paid_amount: app3Schedules[1].installment_amount,
        payment_status: 'PAID',
        paid_date: new Date('2026-06-01T11:00:00Z'),
        updated_by: victor.user_id,
      },
    })
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
    })

    await prisma.repayment_schedule.update({
      where: { schedule_id: app4Schedules[0].schedule_id },
      data: {
        paid_amount: app4Schedules[0].installment_amount,
        payment_status: 'PAID',
        paid_date: new Date('2026-04-15T09:15:00Z'),
        updated_by: victor.user_id,
      },
    })
  }

  await prisma.application_status_audit.createMany({
    data: [
      {
        application_number: 'CP-2026-0001',
        dob_hash: '1997-02-14',
        success: true,
        reason_code: 'MATCH_FOUND',
        ip_address: '127.0.0.1',
        user_agent: 'Seed Script / Internal Test',
      },
      {
        application_number: 'CP-2026-0002',
        dob_hash: '1995-11-03',
        success: true,
        reason_code: 'MATCH_FOUND',
        ip_address: '127.0.0.1',
        user_agent: 'Seed Script / Internal Test',
      },
      {
        application_number: 'CP-2026-9999',
        dob_hash: '2001-01-01',
        success: false,
        reason_code: 'APPLICATION_NOT_FOUND',
        ip_address: '127.0.0.1',
        user_agent: 'Seed Script / Negative Test',
      },
    ],
  })

  console.log('Seed completed successfully.')
  console.log('System users:')
  console.log('Victor  -> victor@creditpulse.com / Victor@123')
  console.log('Miswa   -> miswa@creditpulse.com / Miswa@123')
  console.log('Nirali  -> nirali@creditpulse.com / Nirali@123')
  console.log('Sukh    -> sukh@creditpulse.com / Sukh@123')
}

main()
  .catch((error) => {
    console.error('Seed failed.', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
