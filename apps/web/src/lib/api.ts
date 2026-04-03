import {
  apiErrorSchema,
  apiSuccessSchema,
  type Note,
  type CreateNoteInput,
  type ApiSuccess,
  type ApiError,
} from '@blueprint/shared';
import { loadWebApiConfig } from './config.js';

const API_CONFIG = loadWebApiConfig(import.meta.env);

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiRequestError';
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
    const parsed = apiErrorSchema.parse((await response.json()) as ApiError);
    const body = parsed;
    throw new ApiRequestError(response.status, body.error.code, body.error.message);
  }

  const body = apiSuccessSchema.parse((await response.json()) as ApiSuccess<T>);
  return body.data as T;
}

export async function fetchNotes(): Promise<Note[]> {
  return request<Note[]>('/notes');
}

export async function createNoteRequest(input: CreateNoteInput): Promise<Note> {
  return request<Note>('/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}
