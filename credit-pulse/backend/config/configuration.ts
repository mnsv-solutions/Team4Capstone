import * as yaml from 'js-yaml';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));

export default () => {
  const env = process.env.NODE_ENV || 'local';

  const envConfig = yaml.load(
    readFileSync(join(currentDir, `config.${env}.yaml`), 'utf8'),
  ) as Record<string, any>;

  return envConfig;
};
