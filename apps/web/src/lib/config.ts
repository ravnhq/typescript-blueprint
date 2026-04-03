interface WebApiConfigSource {
  readonly VITE_API_AUTH_TOKEN?: string;
  readonly VITE_API_URL?: string;
}

export interface WebApiConfig {
  readonly apiAuthToken?: string;
  readonly apiUrl: string;
}

export function loadWebApiConfig(source: WebApiConfigSource): WebApiConfig {
  const apiUrl = source.VITE_API_URL?.trim() ?? 'http://localhost:3001';
  const apiAuthToken = source.VITE_API_AUTH_TOKEN?.trim();

  return apiAuthToken === undefined || apiAuthToken === '' ? { apiUrl } : { apiAuthToken, apiUrl };
}
