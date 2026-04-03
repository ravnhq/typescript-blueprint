import { describe, it, expect } from 'vitest';
import type { CreateNoteInput, NoteId } from '../validation/notes.js';
import { buildNote, sortNotesByDate } from './notes.js';

describe('buildNote', () => {
  it('creates a valid note from id, input, and timestamp', () => {
    const input: CreateNoteInput = { title: 'Test', body: 'Content' };
    const result = buildNote(
      '550e8400-e29b-41d4-a716-446655440000' as NoteId,
      input,
      '2026-04-01T10:00:00.000Z',
    );
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toStrictEqual({
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test',
        body: 'Content',
        createdAt: '2026-04-01T10:00:00.000Z',
      });
    }
  });

  it('rejects invalid input with empty title', () => {
    const input = { title: '', body: 'Content' } as CreateNoteInput;
    const result = buildNote(
      '550e8400-e29b-41d4-a716-446655440000' as NoteId,
      input,
      '2026-04-01T10:00:00.000Z',
    );
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe('Invalid note input');
    }
  });
});

describe('sortNotesByDate', () => {
  it('sorts notes by createdAt descending', () => {
    const notes = [
      { id: 'a' as NoteId, title: 'First', body: 'A', createdAt: '2026-04-01T10:00:00.000Z' },
      { id: 'b' as NoteId, title: 'Second', body: 'B', createdAt: '2026-04-01T11:00:00.000Z' },
    ];
    const sorted = sortNotesByDate(notes);
    expect(sorted[0]?.title).toBe('Second');
    expect(sorted[1]?.title).toBe('First');
  });

  it('returns empty array for empty input', () => {
    const sorted = sortNotesByDate([]);
    expect(sorted).toEqual([]);
  });
});
