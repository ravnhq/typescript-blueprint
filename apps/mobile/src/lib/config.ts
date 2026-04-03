import { Platform } from 'react-native';

interface MobileApiConfigSource {
  readonly EXPO_PUBLIC_API_AUTH_TOKEN?: string;
  readonly EXPO_PUBLIC_API_URL?: string;
}

export interface MobileApiConfig {
  readonly apiAuthToken?: string;
  readonly apiUrl: string;
}

export function loadMobileApiConfig(source: MobileApiConfigSource): MobileApiConfig {
  const defaultHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  const trimmedApiUrl = source.EXPO_PUBLIC_API_URL?.trim();
  const apiUrl =
    trimmedApiUrl === undefined || trimmedApiUrl === ''
      ? `http://${defaultHost}:3001`
      : trimmedApiUrl;
  const apiAuthToken = source.EXPO_PUBLIC_API_AUTH_TOKEN?.trim();

  return apiAuthToken === undefined || apiAuthToken === '' ? { apiUrl } : { apiAuthToken, apiUrl };
}
