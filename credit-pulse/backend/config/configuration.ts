import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as yaml from 'js-yaml';

export default () => {
  const env = process.env.NODE_ENV || 'local';

  const envConfig = yaml.load(
    readFileSync(join(__dirname, `config.${env}.yaml`), 'utf8'),
  ) as Record<string, any>;

  return envConfig;
};
