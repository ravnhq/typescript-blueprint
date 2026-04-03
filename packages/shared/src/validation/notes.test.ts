import { describe, it, expect } from 'vitest';
import {
  noteSchema,
  createNoteInputSchema,
  type Note,
  type CreateNoteInput,
  type NoteId,
} from './notes.js';

describe('note schemas', () => {
  const validNote = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'My Note',
    body: 'Some content here',
    createdAt: '2026-04-02T12:00:00.000Z',
  };

  const validInput = {
    title: 'My Note',
    body: 'Some content here',
  };

  describe('noteSchema', () => {
    it('parses a valid note', () => {
      const result = noteSchema.safeParse(validNote);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('550e8400-e29b-41d4-a716-446655440000');
        expect(result.data.title).toBe('My Note');
        expect(result.data.body).toBe('Some content here');
        expect(result.data.createdAt).toBe('2026-04-02T12:00:00.000Z');
      }
    });

    it('rejects a note with empty title', () => {
      const result = noteSchema.safeParse({ ...validNote, title: '' });
      expect(result.success).toBe(false);
    });

    it('rejects a note with title exceeding 100 characters', () => {
      const result = noteSchema.safeParse({
        ...validNote,
        title: 'a'.repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it('rejects a note with body exceeding 2000 characters', () => {
      const result = noteSchema.safeParse({
        ...validNote,
        body: 'a'.repeat(2001),
      });
      expect(result.success).toBe(false);
    });

    it('rejects a note with non-UUID id', () => {
      const result = noteSchema.safeParse({ ...validNote, id: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });

    it('rejects a note with invalid datetime', () => {
      const result = noteSchema.safeParse({
        ...validNote,
        createdAt: 'not-a-date',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createNoteInputSchema', () => {
    it('parses valid input', () => {
      const result = createNoteInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('My Note');
        expect(result.data.body).toBe('Some content here');
      }
    });

    it('rejects input with empty title', () => {
      const result = createNoteInputSchema.safeParse({ ...validInput, title: '' });
      expect(result.success).toBe(false);
    });

    it('allows empty body', () => {
      const result = createNoteInputSchema.safeParse({ ...validInput, body: '' });
      expect(result.success).toBe(true);
    });

    it('rejects input with missing title', () => {
      const result = createNoteInputSchema.safeParse({ body: 'content' });
      expect(result.success).toBe(false);
    });
  });

  describe('type inference', () => {
    it('Note type matches schema shape', () => {
      const note: Note = {
        id: '550e8400-e29b-41d4-a716-446655440000' as NoteId,
        title: 'Test',
        body: 'Body',
        createdAt: '2026-04-02T12:00:00.000Z',
      };
      expect(noteSchema.safeParse(note).success).toBe(true);
    });

    it('CreateNoteInput type matches schema shape', () => {
      const input: CreateNoteInput = {
        title: 'Test',
        body: 'Body',
      };
      expect(createNoteInputSchema.safeParse(input).success).toBe(true);
    });
  });
});
