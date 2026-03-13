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

async function seedRoles() {
  const adminRole = await prisma.roles.upsert({
    where: { role_code: 'ADMIN' },
    update: { role_name: 'Administrator', is_active: true },
    create: {
      role_code: 'ADMIN',
      role_name: 'Administrator',
      is_active: true,
    },
  });

  const analystRole = await prisma.roles.upsert({
    where: { role_code: 'ANALYST' },
    update: { role_name: 'Credit Analyst', is_active: true },
    create: {
      role_code: 'ANALYST',
      role_name: 'Credit Analyst',
      is_active: true,
    },
  });

  return { adminRole, analystRole };
}

async function seedUsers(roleIds: { adminRoleId: string; analystRoleId: string }) {
  const password = '123456';
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.users.upsert({
    where: { email: 'admin@creditpulse.local' },
    update: {
      first_name: 'System',
      last_name: 'Admin',
      role_id: roleIds.adminRoleId,
      is_active: true,
      is_email_verified: true,
      is_system_user: true,
    },
    create: {
      first_name: 'System',
      last_name: 'Admin',
      email: 'admin@creditpulse.local',
      phone: '+10000000001',
      password_hash: passwordHash,
      role_id: roleIds.adminRoleId,
      is_active: true,
      is_email_verified: true,
      is_system_user: true,
    },
  });

  await prisma.users.upsert({
    where: { email: 'analyst@creditpulse.local' },
    update: {
      first_name: 'Credit',
      last_name: 'Analyst',
      role_id: roleIds.analystRoleId,
      is_active: true,
      is_email_verified: true,
      is_system_user: false,
    },
    create: {
      first_name: 'Credit',
      last_name: 'Analyst',
      email: 'analyst@creditpulse.local',
      phone: '+10000000002',
      password_hash: passwordHash,
      role_id: roleIds.analystRoleId,
      is_active: true,
      is_email_verified: true,
      is_system_user: false,
    },
  });
}

async function main() {
  const { adminRole, analystRole } = await seedRoles();

  await seedUsers({
    adminRoleId: adminRole.role_id,
    analystRoleId: analystRole.role_id,
  });

  console.log('Seed complete: roles and users were upserted successfully.');
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
