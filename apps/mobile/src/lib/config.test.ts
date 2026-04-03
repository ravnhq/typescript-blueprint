// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

const platformMock = vi.hoisted(() => ({ OS: 'android' as string }));

vi.mock('react-native', () => ({
  Platform: platformMock,
}));

import { loadMobileApiConfig } from './config';

describe('loadMobileApiConfig', () => {
  beforeEach(() => {
    platformMock.OS = 'android';
  });

  it('falls back to the emulator host on Android', () => {
    expect(loadMobileApiConfig({}).apiUrl).toBe('http://10.0.2.2:3001');
  });

  it('falls back to localhost on iOS', () => {
    platformMock.OS = 'ios';
    expect(loadMobileApiConfig({}).apiUrl).toBe('http://localhost:3001');
  });

  it('falls back when the configured API URL is blank', () => {
    expect(
      loadMobileApiConfig({
        EXPO_PUBLIC_API_URL: '   ',
      }).apiUrl,
    ).toBe('http://10.0.2.2:3001');
  });

  it('returns a trimmed auth token when configured', () => {
    const config = loadMobileApiConfig({
      EXPO_PUBLIC_API_AUTH_TOKEN: '  mobile-token  ',
      EXPO_PUBLIC_API_URL: ' https://api.example.com ',
    });

    expect(config.apiAuthToken).toBe('mobile-token');
    expect(config.apiUrl).toBe('https://api.example.com');
  });
});
