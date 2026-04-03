import {
  apiErrorSchema,
  apiSuccessSchema,
  type ApiError,
  type ApiSuccess,
  type CreateNoteInput,
  type Note,
} from '@blueprint/shared';
import { loadMobileApiConfig, type MobileApiConfig } from './config';

function readExpoEnvVariable(
  key: 'EXPO_PUBLIC_API_AUTH_TOKEN' | 'EXPO_PUBLIC_API_URL',
): string | undefined {
  const environment = process.env as Record<string, unknown>;
  const value = environment[key];
  return typeof value === 'string' ? value : undefined;
}

function loadRuntimeApiConfig(): MobileApiConfig {
  const apiAuthToken = readExpoEnvVariable('EXPO_PUBLIC_API_AUTH_TOKEN');
  const apiUrl = readExpoEnvVariable('EXPO_PUBLIC_API_URL');

  return loadMobileApiConfig({
    ...(apiAuthToken === undefined ? {} : { EXPO_PUBLIC_API_AUTH_TOKEN: apiAuthToken }),
    ...(apiUrl === undefined ? {} : { EXPO_PUBLIC_API_URL: apiUrl }),
  });
}

const API_CONFIG = loadRuntimeApiConfig();

export class MobileApiRequestError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'MobileApiRequestError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  if (API_CONFIG.apiAuthToken !== undefined) {
    headers.set('Authorization', `Bearer ${API_CONFIG.apiAuthToken}`);
  }

  const response = await fetch(`${API_CONFIG.apiUrl}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = apiErrorSchema.parse((await response.json()) as ApiError);
    throw new MobileApiRequestError(response.status, body.error.code, body.error.message);
  }

  const body = apiSuccessSchema.parse((await response.json()) as ApiSuccess<T>);
  return body.data as T;
}

export async function fetchNotes(): Promise<Note[]> {
  return request<Note[]>('/notes');
}

export async function createNoteRequest(input: CreateNoteInput): Promise<Note> {
  return request<Note>('/notes', {
    body: JSON.stringify(input),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
}
