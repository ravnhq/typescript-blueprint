import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from '@blueprint/testing-config/vitest';

export default mergeConfig(baseConfig, defineConfig({}));
