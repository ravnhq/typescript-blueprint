import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { NoteId, CreateNoteInput } from '@blueprint/shared';
import {
  createFileBackedNotesStore,
  createInMemoryNotesStore,
  type NotesStore,
} from './notes.store.js';

describe('notes store', () => {
  let store: NotesStore;

  beforeEach(() => {
    vi.useFakeTimers();
    store = createInMemoryNotesStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createNote', () => {
    it('creates a note with valid input', () => {
      const input: CreateNoteInput = { title: 'Test', body: 'Content' };
      const result = store.createNote(input);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe('Test');
        expect(result.value.body).toBe('Content');
        expect(result.value.id).toBeTruthy();
        expect(result.value.createdAt).toBeTruthy();
      }
    });

    it('rejects invalid input', () => {
      const input = { title: '', body: 'Content' } as CreateNoteInput;
      const result = store.createNote(input);
      expect(result.isErr()).toBe(true);
    });
  });

  describe('getAllNotes', () => {
    it('returns empty array when no notes exist', () => {
      const result = store.getAllNotes();
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual([]);
      }
    });

    it('returns all created notes sorted by createdAt descending', () => {
      vi.setSystemTime(new Date('2026-04-01T10:00:00.000Z'));
      store.createNote({ title: 'First', body: 'A' });
      vi.setSystemTime(new Date('2026-04-01T11:00:00.000Z'));
      store.createNote({ title: 'Second', body: 'B' });
      const result = store.getAllNotes();
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0]?.title).toBe('Second');
        expect(result.value[1]?.title).toBe('First');
      }
    });
  });

  describe('getNoteById', () => {
    it('returns a note by id', () => {
      const created = store.createNote({ title: 'Find me', body: 'Here' });
      if (!created.isOk()) {
        throw new Error('Setup failed');
      }
      const result = store.getNoteById(created.value.id as NoteId);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe('Find me');
      }
    });

    it('returns error for non-existent id', () => {
      const result = store.getNoteById('non-existent' as NoteId);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Note not found');
      }
    });
  });

  describe('createFileBackedNotesStore', () => {
    it('persists notes to disk', () => {
      const directory = mkdtempSync(join(tmpdir(), 'blueprint-notes-'));
      const filePath = join(directory, 'notes.json');
      const fileStore = createFileBackedNotesStore({ filePath });

      const created = fileStore.createNote({ title: 'Persisted', body: 'Stored on disk' });

      expect(created.isOk()).toBe(true);
      const fileContents = JSON.parse(readFileSync(filePath, 'utf8')) as { notes: unknown[] };
      expect(fileContents.notes).toHaveLength(1);
    });

    it('reads and clears persisted notes', () => {
      const directory = mkdtempSync(join(tmpdir(), 'blueprint-notes-'));
      const filePath = join(directory, 'notes.json');
      const firstStore = createFileBackedNotesStore({ filePath });
      const secondStore = createFileBackedNotesStore({ filePath });

      firstStore.createNote({ title: 'Persisted', body: 'Stored on disk' });

      const readResult = secondStore.getAllNotes();
      if (!readResult.isOk()) {
        throw new Error('Expected persisted notes to load successfully');
      }
      expect(readResult.value).toHaveLength(1);

      secondStore.clearNotes();
      const clearedResult = secondStore.getAllNotes();
      if (!clearedResult.isOk()) {
        throw new Error('Expected cleared notes to load successfully');
      }
      expect(clearedResult.value).toEqual([]);
    });

    it('treats corrupted persisted notes as empty data', () => {
      const directory = mkdtempSync(join(tmpdir(), 'blueprint-notes-'));
      const filePath = join(directory, 'notes.json');
      writeFileSync(filePath, '{"notes":"broken"}');
      const fileStore = createFileBackedNotesStore({ filePath });

      const allNotesResult = fileStore.getAllNotes();
      expect(allNotesResult.isOk()).toBe(true);
      if (!allNotesResult.isOk()) {
        throw new Error('Expected corrupted persisted notes to be treated as empty data');
      }

      expect(allNotesResult.value).toEqual([]);
      expect(fileStore.getNoteById('missing-note' as NoteId).isErr()).toBe(true);
    });

    it('returns error when creating a note with invalid input in file-backed store', () => {
      const directory = mkdtempSync(join(tmpdir(), 'blueprint-notes-'));
      const filePath = join(directory, 'notes.json');
      const fileStore = createFileBackedNotesStore({ filePath });

      const result = fileStore.createNote({ title: '', body: 'Content' } as CreateNoteInput);
      expect(result.isErr()).toBe(true);
    });

    it('retrieves a note by id from file-backed store', () => {
      const directory = mkdtempSync(join(tmpdir(), 'blueprint-notes-'));
      const filePath = join(directory, 'notes.json');
      const fileStore = createFileBackedNotesStore({ filePath });

      const created = fileStore.createNote({ title: 'Lookup', body: 'Find me' });
      if (!created.isOk()) {
        throw new Error('Setup failed');
      }
      const result = fileStore.getNoteById(created.value.id as NoteId);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe('Lookup');
      }
    });

    it('returns error for non-existent note in file-backed store', () => {
      const directory = mkdtempSync(join(tmpdir(), 'blueprint-notes-'));
      const filePath = join(directory, 'notes.json');
      const fileStore = createFileBackedNotesStore({ filePath });

      fileStore.createNote({ title: 'Existing', body: 'A note' });
      const result = fileStore.getNoteById('550e8400-e29b-41d4-a716-446655440000' as NoteId);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Note not found');
      }
    });
  });
});
