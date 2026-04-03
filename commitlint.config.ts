import type { UserConfig } from '@commitlint/types';

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'shared',
        'api',
        'web',
        'mobile',
        'eslint',
        'typescript',
        'testing',
        'ci',
        'deps',
        'release',
        'ruler',
      ],
    ],
    'scope-empty': [2, 'never'],
    'body-max-line-length': [1, 'always', 100],
    'footer-max-line-length': [1, 'always', 100],
  },
};

export default config;
