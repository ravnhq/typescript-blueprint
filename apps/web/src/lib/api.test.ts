import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ApiSuccess, ApiError, Note } from '@blueprint/shared';

const configMock = vi.hoisted(() => ({
  apiUrl: 'http://localhost:3001',
  apiAuthToken: undefined as string | undefined,
}));

vi.mock('./config.js', () => ({
  loadWebApiConfig: () => configMock,
}));

import { fetchNotes, createNoteRequest, ApiRequestError } from './api.js';

const singleNote: Note = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Test',
  body: 'Body',
  createdAt: '2026-04-02T12:00:00.000Z',
};

const mockNote: ApiSuccess<Note[]> = {
  data: [singleNote],
};

const mockError: ApiError = {
  error: { code: 'VALIDATION_ERROR', message: 'Validation failed' },
};

describe('API client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchNotes returns notes array', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockNote), { status: 200 }),
    );
    const notes = await fetchNotes();
    expect(notes).toEqual(mockNote.data);
  });

  it('createNoteRequest sends POST and returns note', async () => {
    const created: ApiSuccess<Note> = {
      data: singleNote,
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(created), { status: 201 }),
    );
    const note = await createNoteRequest({ title: 'Test', body: 'Body' });
    expect(note.title).toBe('Test');
    const fetchSpy = vi.mocked(globalThis.fetch);
    const firstCall = fetchSpy.mock.calls[0];
    expect(firstCall).toBeDefined();
    if (firstCall === undefined) {
      throw new Error('Expected fetch to be called');
    }
    expect(fetchSpy).toHaveBeenCalledWith('http://localhost:3001/notes', expect.any(Object));
    expect(fetchSpy.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('includes Authorization header when apiAuthToken is configured', async () => {
    configMock.apiAuthToken = 'test-token';
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockNote), { status: 200 }),
    );
    await fetchNotes();
    const fetchSpy = vi.mocked(globalThis.fetch);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const requestHeaders = new Headers(options.headers);
    expect(requestHeaders.get('Authorization')).toBe('Bearer test-token');
    configMock.apiAuthToken = undefined;
  });

  it('throws ApiRequestError on non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockError), { status: 400 }),
    );
    await expect(fetchNotes()).rejects.toThrow(ApiRequestError);
  });

  it('ApiRequestError contains status and code', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockError), { status: 400 }),
    );
    try {
      await fetchNotes();
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiRequestError);
      const apiError = error as ApiRequestError;
      expect(apiError.status).toBe(400);
      expect(apiError.code).toBe('VALIDATION_ERROR');
    }
  });
});
