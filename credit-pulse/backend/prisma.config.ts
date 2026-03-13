import * as yaml from 'js-yaml';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'prisma/config';

type DbConfig = {
  db?: {
    postgres?: {
      host?: string;
      port?: number;
      username?: string;
      password?: string;
      database?: string;
      schema?: string;
    };
  };
};

function buildUrl(pg: NonNullable<DbConfig['db']>['postgres']): string {
  if (!pg) throw new Error('Missing db.postgres section in YAML config.');

  if (!pg.host || !pg.port || !pg.username || !pg.database) {
    throw new Error('Missing required db.postgres YAML values.');
  }

  const user = encodeURIComponent(pg.username);
  const password = encodeURIComponent(pg.password ?? '');
  const schema = pg.schema ?? 'public';
  return `postgresql://${user}:${password}@${pg.host}:${pg.port}/${pg.database}?schema=${schema}`;
}

const env = process.env.NODE_ENV ?? 'local';
const configPath = join(process.cwd(), 'config', `config.${env}.yaml`);
const config = yaml.load(readFileSync(configPath, 'utf8')) as DbConfig;
const url = buildUrl(config.db?.postgres);

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: { url },
});
