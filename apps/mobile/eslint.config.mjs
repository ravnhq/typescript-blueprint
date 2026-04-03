// @ts-check
import baseConfig from '@blueprint/eslint-config';
import tseslint from 'typescript-eslint';

export default tseslint.config(...baseConfig, {
  languageOptions: {
    parserOptions: {
      tsconfigRootDir: import.meta.dirname,
    },
  },
  rules: {
    'unicorn/filename-case': [
      'error',
      {
        case: 'kebabCase',
        ignore: ['^\\[.*\\]\\.tsx?$', '^_layout\\.tsx?$'],
      },
    ],
  },
});
