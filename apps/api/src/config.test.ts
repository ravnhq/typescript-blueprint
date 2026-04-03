import { describe, it, expect } from 'vitest';
import { loadApiConfig } from './config.js';

describe('loadApiConfig', () => {
  it('parses defaults for local development', () => {
    const config = loadApiConfig({});

    expect(config.port).toBe(3001);
    expect(config.allowedOrigins).toContain('http://localhost:3000');
    expect(config.rateLimitMaxRequests).toBeGreaterThan(0);
    expect(config.authToken).toBeUndefined();
  });

  it('requires an auth token in production', () => {
    expect(() => {
      loadApiConfig({ NODE_ENV: 'production' });
    }).toThrow(/API_AUTH_TOKEN/i);
  });

  it('defaults logLevel to info for non-test environments', () => {
    const config = loadApiConfig({ NODE_ENV: 'development' });

    expect(config.logLevel).toBe('info');
  });

  it('defaults logLevel to silent for test environment', () => {
    const config = loadApiConfig({ NODE_ENV: 'test' });

    expect(config.logLevel).toBe('silent');
  });

  it('parses explicit origins and rate-limit values', () => {
    const config = loadApiConfig({
      API_ALLOWED_ORIGINS: 'https://app.example.com, https://admin.example.com ',
      API_RATE_LIMIT_MAX_REQUESTS: '25',
      API_RATE_LIMIT_WINDOW_MS: '15000',
      PORT: '4000',
    });

    expect(config.allowedOrigins).toEqual(['https://app.example.com', 'https://admin.example.com']);
    expect(config.port).toBe(4000);
    expect(config.rateLimitMaxRequests).toBe(25);
    expect(config.rateLimitWindowMs).toBe(15_000);
  });
});
