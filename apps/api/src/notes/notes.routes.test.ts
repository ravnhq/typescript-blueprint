import { describe, it, expect, beforeEach } from 'vitest';
import { noteSchema, ok, err, type Note } from '@blueprint/shared';
import { createApp } from '../app.js';
import { createInMemoryNotesStore } from './notes.store.js';
import type { ApiConfig } from '../config.js';

const testConfig: ApiConfig = {
  allowedOrigins: ['http://localhost:3000'],
  authToken: 'test-token',
  logLevel: 'silent',
  nodeEnv: 'test',
  notesDataFile: '/tmp/blueprint-notes-routes-test.json',
  port: 3001,
  rateLimitMaxRequests: 2,
  rateLimitWindowMs: 60_000,
};

describe('notes routes', () => {
  let notesStore = createInMemoryNotesStore();
  let app = createApp({ config: testConfig, notesStore });

  beforeEach(() => {
    notesStore = createInMemoryNotesStore();
    app = createApp({ config: testConfig, notesStore });
    notesStore.clearNotes();
  });

  describe('GET /notes', () => {
    it('returns empty array in data envelope', async () => {
      const res = await app.request('/notes', {
        headers: { Authorization: 'Bearer test-token' },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { data: unknown[] };
      expect(body.data).toEqual([]);
    });
  });

  describe('POST /notes', () => {
    it('creates a note with valid input', async () => {
      const res = await app.request('/notes', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'Test Note', body: 'Hello world' }),
      });
      expect(res.status).toBe(201);
      const body = (await res.json()) as { data: unknown };
      const note = noteSchema.parse(body.data);
      expect(note.title).toBe('Test Note');
      expect(note.body).toBe('Hello world');
    });

    it('returns 400 with error envelope for invalid input', async () => {
      const res = await app.request('/notes', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: '', body: 'No title' }),
      });
      expect(res.status).toBe(400);
      const body = (await res.json()) as {
        error: { code: string; message: string; details?: unknown[] };
      };
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.details).toBeDefined();
    });

    it('returns 400 with error envelope for malformed JSON', async () => {
      const res = await app.request('/notes', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: 'not json',
      });
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: { code: string } };
      expect(body.error.code).toBe('BAD_REQUEST');
    });
  });

  describe('GET /notes/:id', () => {
    it('returns a note by id in data envelope', async () => {
      const createRes = await app.request('/notes', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'Find me', body: 'Here' }),
      });
      const created = (await createRes.json()) as { data: Note };

      const res = await app.request(`/notes/${created.data.id}`, {
        headers: { Authorization: 'Bearer test-token' },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { data: { title: string } };
      expect(body.data.title).toBe('Find me');
    });

    it('returns 404 with error envelope for non-existent note', async () => {
      const res = await app.request('/notes/550e8400-e29b-41d4-a716-446655440000', {
        headers: { Authorization: 'Bearer test-token' },
      });
      expect(res.status).toBe(404);
      const body = (await res.json()) as { error: { code: string; message: string } };
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('returns 400 for invalid UUID id', async () => {
      const res = await app.request('/notes/not-a-uuid', {
        headers: { Authorization: 'Bearer test-token' },
      });
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: { code: string } };
      expect(body.error.code).toBe('BAD_REQUEST');
    });
  });

  it('returns 500 when createNote fails', async () => {
    const failingStore = {
      clearNotes: () => {
        /* no-op for test */
      },
      createNote: () => err(new Error('Store write failure')),
      getAllNotes: () => ok([]),
      getNoteById: () => err(new Error('Not found')),
    };
    const failApp = createApp({ config: testConfig, notesStore: failingStore });
    const res = await failApp.request('/notes', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: 'Test', body: 'Content' }),
    });
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toBe('Store write failure');
  });

  it('returns 500 when getAllNotes fails', async () => {
    const failingStore = {
      clearNotes: () => {
        /* no-op for test */
      },
      createNote: () => err(new Error('Store failure')),
      getAllNotes: () => err(new Error('Store failure') as never),
      getNoteById: () => err(new Error('Store failure')),
    };
    const failApp = createApp({ config: testConfig, notesStore: failingStore });
    const res = await failApp.request('/notes', {
      headers: { Authorization: 'Bearer test-token' },
    });
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });

  it('rejects unauthorized note requests when auth token is configured', async () => {
    const res = await app.request('/notes');
    expect(res.status).toBe(401);
  });

  it('rejects requests above the rate limit', async () => {
    const headers = { Authorization: 'Bearer test-token', 'x-forwarded-for': '203.0.113.1' };

    const first = await app.request('/notes', { headers });
    const second = await app.request('/notes', { headers });
    const third = await app.request('/notes', { headers });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    expect(third.headers.get('retry-after')).toBeTruthy();
  });

  it('returns an allowed origin for configured web clients', async () => {
    const res = await app.request('/notes', {
      headers: {
        Authorization: 'Bearer test-token',
        Origin: 'http://localhost:3000',
      },
    });

    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:3000');
  });
});
