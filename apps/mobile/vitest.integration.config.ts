import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from '@blueprint/testing-config/vitest-integration';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      include: ['src/**/*.integration.test.ts', 'src/**/*.integration.test.tsx'],
    },
  }),
);
