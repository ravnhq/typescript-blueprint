import { describe, it, expect } from 'vitest';
import { parseNote, parseCreateNoteInput } from '../note.js';

const VALID_NOTE_ID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_DATETIME = '2026-04-01T10:00:00.000Z';

const validNote = {
  id: VALID_NOTE_ID,
  title: 'Hello',
  body: 'World',
  createdAt: VALID_DATETIME,
};

const validCreateInput = {
  title: 'Hello',
  body: 'World',
};

// C4: no-throw fuzz helper — runs parser against arbitrary unknown values without throwing
function doesNotThrow(parser: (x: unknown) => unknown, input: unknown): boolean {
  try {
    parser(input);
    return true;
  } catch {
    return false;
  }
}

describe('parseNote (boundary contract)', () => {
  // C1: positive — accepts valid carrier, returns { ok: true, value }
  it('C1: accepts a representative valid note carrier', () => {
    const result = parseNote(validNote);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe(VALID_NOTE_ID);
      expect(result.value.title).toBe('Hello');
      expect(result.value.body).toBe('World');
      expect(result.value.createdAt).toBe(VALID_DATETIME);
    }
  });

  // C2: negative — rejects malformed carrier with { ok: false, error } of stable shape
  it('C2: rejects a note with empty title and returns stable error shape', () => {
    const result = parseNote({ ...validNote, title: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Array.isArray(result.error)).toBe(true);
      expect(result.error.length).toBeGreaterThan(0);
      const firstError = result.error[0];
      expect(firstError).toHaveProperty('field');
      expect(firstError).toHaveProperty('message');
      expect(typeof firstError?.field).toBe('string');
      expect(typeof firstError?.message).toBe('string');
    }
  });

  it('C2: rejects a note with non-UUID id', () => {
    const result = parseNote({ ...validNote, id: 'not-a-uuid' });
    expect(result.ok).toBe(false);
  });

  it('C2: rejects a note with invalid datetime', () => {
    const result = parseNote({ ...validNote, createdAt: 'not-a-date' });
    expect(result.ok).toBe(false);
  });

  it('C2: rejects a note missing required fields', () => {
    const result = parseNote({ id: VALID_NOTE_ID });
    expect(result.ok).toBe(false);
  });

  // C3: idempotence — parsing an already-parsed value yields the same result
  it('C3: parsing the parsed value is idempotent', () => {
    const first = parseNote(validNote);
    expect(first.ok).toBe(true);
    if (first.ok) {
      const second = parseNote(first.value);
      expect(second.ok).toBe(true);
      if (second.ok) {
        expect(second.value).toStrictEqual(first.value);
      }
    }
  });

  // C4: no-throw — parser does not throw on arbitrary unknown inputs
  it('C4: does not throw on null', () => {
    expect(doesNotThrow(parseNote, null)).toBe(true);
  });

  it('C4: does not throw on undefined', () => {
    expect(doesNotThrow(parseNote, undefined)).toBe(true);
  });

  it('C4: does not throw on a string', () => {
    expect(doesNotThrow(parseNote, 'arbitrary string')).toBe(true);
  });

  it('C4: does not throw on a number', () => {
    expect(doesNotThrow(parseNote, 42)).toBe(true);
  });

  it('C4: does not throw on an empty object', () => {
    expect(doesNotThrow(parseNote, {})).toBe(true);
  });

  it('C4: does not throw on an array', () => {
    expect(doesNotThrow(parseNote, [1, 2, 3])).toBe(true);
  });
});

describe('parseCreateNoteInput (boundary contract)', () => {
  // C1: positive — accepts valid carrier, returns { ok: true, value }
  it('C1: accepts a representative valid create-note-input carrier', () => {
    const result = parseCreateNoteInput(validCreateInput);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.title).toBe('Hello');
      expect(result.value.body).toBe('World');
    }
  });

  it('C1: accepts empty body', () => {
    const result = parseCreateNoteInput({ title: 'Hello', body: '' });
    expect(result.ok).toBe(true);
  });

  // C2: negative — rejects malformed carrier with { ok: false, error } of stable shape
  it('C2: rejects input with empty title', () => {
    const result = parseCreateNoteInput({ ...validCreateInput, title: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Array.isArray(result.error)).toBe(true);
      const firstError = result.error[0];
      expect(firstError).toHaveProperty('field');
      expect(firstError).toHaveProperty('message');
    }
  });

  it('C2: rejects input with missing title', () => {
    const result = parseCreateNoteInput({ body: 'some body' });
    expect(result.ok).toBe(false);
  });

  it('C2: rejects input with title exceeding 100 characters', () => {
    const result = parseCreateNoteInput({ title: 'a'.repeat(101), body: '' });
    expect(result.ok).toBe(false);
  });

  // C3: idempotence
  it('C3: parsing the parsed value is idempotent', () => {
    const first = parseCreateNoteInput(validCreateInput);
    expect(first.ok).toBe(true);
    if (first.ok) {
      const second = parseCreateNoteInput(first.value);
      expect(second.ok).toBe(true);
      if (second.ok) {
        expect(second.value).toStrictEqual(first.value);
      }
    }
  });

  // C4: no-throw
  it('C4: does not throw on null', () => {
    expect(doesNotThrow(parseCreateNoteInput, null)).toBe(true);
  });

  it('C4: does not throw on undefined', () => {
    expect(doesNotThrow(parseCreateNoteInput, undefined)).toBe(true);
  });

  it('C4: does not throw on a number', () => {
    expect(doesNotThrow(parseCreateNoteInput, 99)).toBe(true);
  });

  it('C4: does not throw on an empty object', () => {
    expect(doesNotThrow(parseCreateNoteInput, {})).toBe(true);
  });
});
