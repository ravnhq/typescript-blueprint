// @ts-check
import js from '@eslint/js';
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import prettierConfig from 'eslint-config-prettier';
import unicorn from 'eslint-plugin-unicorn';
import promise from 'eslint-plugin-promise';
import security from 'eslint-plugin-security';
import sonarjs from 'eslint-plugin-sonarjs';
import regexp from 'eslint-plugin-regexp';
import deMorgan from 'eslint-plugin-de-morgan';

/** @type {import('typescript-eslint').ConfigArray} */
export default tseslint.config(
  // Global ignores
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/.expo/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/coverage-integration/**',
      '**/.output/**',
      '**/*.config.mjs',
      '**/eslint.config.mjs',
      '.pnpmfile.cjs',
      '**/vitest.config.js',
      '**/vitest.config.d.ts',
      '**/vitest.*.config.js',
      '**/vitest.*.config.d.ts',
    ],
  },

  // Base JS rules
  js.configs.recommended,

  // TypeScript strict rules (type-aware)
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // All TypeScript files
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.config.ts', '*.config.mts', '*.config.base.ts'],
        },
        // Each workspace eslint.config.mjs overrides tsconfigRootDir.
        // This default is for files linted from the tooling/eslint/ directory itself.
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'eslint-comments': eslintComments,
      unicorn,
      promise,
      security,
      sonarjs,
      regexp,
      'de-morgan': deMorgan,
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/only-throw-error': 'error',
      '@typescript-eslint/no-deprecated': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',

      // ESLint comments
      'eslint-comments/no-unused-disable': 'error',
      'eslint-comments/no-unlimited-disable': 'error',
      'eslint-comments/require-description': ['error', { ignore: [] }],

      // Unicorn
      'unicorn/filename-case': ['error', { case: 'kebabCase', ignore: ['README.md'] }],
      'unicorn/no-null': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-array-callback-reference': 'off',
      'unicorn/prefer-ternary': 'off',

      // Promise
      'promise/always-return': 'error',
      'promise/no-return-wrap': 'error',
      'promise/param-names': 'error',
      'promise/catch-or-return': 'error',
      'promise/no-promise-in-callback': 'error',
      'promise/no-nesting': 'error',
      'promise/no-new-statics': 'error',
      'promise/no-return-in-finally': 'error',
      'promise/valid-params': 'error',

      // Security
      'security/detect-object-injection': 'off',

      // SonarJS
      'sonarjs/prefer-read-only-props': 'off',
      'sonarjs/deprecation': 'off',
      'sonarjs/no-duplicate-string': ['error', { threshold: 5 }],

      // Regexp
      'regexp/no-unused-capturing-group': 'error',
      'regexp/no-super-linear-backtracking': 'error',

      // De-Morgan
      'de-morgan/no-negated-conjunction': 'error',

      // Max lines
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
    },
  },

  // JavaScript files — disable type-aware rules
  {
    files: ['**/*.{js,mjs,cjs,jsx}'],
    ...tseslint.configs.disableTypeChecked,
  },

  // Config files — more relaxed
  {
    files: ['**/*.config.{ts,js,mjs}', '**/*.config.*.{ts,js,mjs}'],
    rules: {
      'max-lines': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'unicorn/prefer-module': 'off',
    },
  },

  // FC/IS boundary — shared (functional core) must not import from apps (imperative shell)
  {
    files: ['**/packages/shared/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@blueprint/api', '@blueprint/api/*'],
              message: 'Functional core (shared) must not import from imperative shell (api).',
            },
            {
              group: ['@blueprint/web', '@blueprint/web/*'],
              message: 'Functional core (shared) must not import from imperative shell (web).',
            },
            {
              group: ['@blueprint/mobile', '@blueprint/mobile/*'],
              message: 'Functional core (shared) must not import from imperative shell (mobile).',
            },
            {
              group: ['hono', 'hono/*'],
              message: 'Functional core must not depend on HTTP framework.',
            },
            {
              group: ['pino', 'pino/*'],
              message: 'Functional core must not depend on logging library.',
            },
            {
              group: ['react', 'react/*', 'react-dom', 'react-dom/*'],
              message: 'Functional core must not depend on React.',
            },
            {
              group: ['react-native', 'react-native/*'],
              message: 'Functional core must not depend on React Native.',
            },
          ],
        },
      ],
    },
  },

  // Test files — relaxed rules
  {
    files: [
      '**/*.test.{ts,tsx}',
      '**/*.integration.test.{ts,tsx}',
      '**/*.e2e.test.{ts,tsx}',
      '**/tests/**/*.{ts,tsx}',
    ],
    rules: {
      'max-lines': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'security/detect-non-literal-regexp': 'off',
    },
  },

  // Prettier must be last
  prettierConfig,
);
