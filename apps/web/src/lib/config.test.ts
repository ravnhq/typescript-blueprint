import { describe, it, expect } from 'vitest';
import { loadWebApiConfig } from './config.js';

describe('loadWebApiConfig', () => {
  it('falls back to the local API URL', () => {
    expect(loadWebApiConfig({}).apiUrl).toBe('http://localhost:3001');
  });

  it('returns a trimmed auth token when configured', () => {
    const config = loadWebApiConfig({
      VITE_API_AUTH_TOKEN: '  test-token  ',
      VITE_API_URL: ' https://api.example.com ',
    });

    expect(config.apiAuthToken).toBe('test-token');
    expect(config.apiUrl).toBe('https://api.example.com');
  });
});
