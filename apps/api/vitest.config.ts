import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from '@blueprint/testing-config/vitest';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      coverage: {
        exclude: ['src/index.ts', 'src/logger.ts'],
      },
    },
  }),
);
