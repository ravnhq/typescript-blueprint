import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import type { ApiConfig } from '../config.js';
import { createFileBackedNotesStore } from './notes.store.js';

describe('notes route integration', () => {
  const directory = mkdtempSync(join(tmpdir(), 'blueprint-notes-integration-'));
  const notesDataFile = join(directory, 'notes.json');

  const testConfig: ApiConfig = {
    allowedOrigins: ['http://localhost:3000'],
    authToken: 'integration-token',
    logLevel: 'silent',
    nodeEnv: 'test',
    notesDataFile,
    port: 3001,
    rateLimitMaxRequests: 10,
    rateLimitWindowMs: 60_000,
  };

  beforeEach(() => {
    createFileBackedNotesStore({ filePath: notesDataFile }).clearNotes();
  });

  it('persists notes across app instances', async () => {
    const firstApp = createApp({
      config: testConfig,
      notesStore: createFileBackedNotesStore({ filePath: notesDataFile }),
    });

    const createResponse = await firstApp.request('/notes', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer integration-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: 'Persist me', body: 'Across restarts' }),
    });

    expect(createResponse.status).toBe(201);

    const secondApp = createApp({
      config: testConfig,
      notesStore: createFileBackedNotesStore({ filePath: notesDataFile }),
    });

    const listResponse = await secondApp.request('/notes', {
      headers: { Authorization: 'Bearer integration-token' },
    });
    const body = (await listResponse.json()) as { data: { title: string }[] };

    expect(listResponse.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.title).toBe('Persist me');
  });
});
