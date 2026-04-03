import { describe, expect, it } from 'vitest';
import { noteSchema, type NoteId } from '../validation/notes.js';
import { buildNote } from './notes.js';

describe('notes domain integration', () => {
  it('creates notes that validate against the shared schema', () => {
    const result = buildNote(
      '550e8400-e29b-41d4-a716-446655440000' as NoteId,
      { title: 'Integrated note', body: 'Shared core flow' },
      '2026-04-03T12:00:00.000Z',
    );

    expect(result.isOk()).toBe(true);
    if (result.isErr()) {
      throw result.error;
    }

    expect(noteSchema.parse(result.value)).toEqual(result.value);
  });
});
