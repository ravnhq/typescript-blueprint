import {
  noteSchema,
  createNoteInputSchema,
  type Note,
  type CreateNoteInput,
} from '../../validation/notes.js';

export interface ParseError {
  readonly field: string;
  readonly message: string;
}

export type ParseResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: ParseError[] };

/**
 * Boundary parser for the Note DTO.
 * Accepts unknown input (e.g. API response body) and returns a typed Result.
 * Must be called by IS code before passing data to FC code.
 */
export function parseNote(raw: unknown): ParseResult<Note> {
  const result = noteSchema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      error: result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    };
  }
  return { ok: true, value: result.data };
}

/**
 * Boundary parser for the CreateNoteInput DTO.
 * Accepts unknown input (e.g. form submission or request body) and returns a typed Result.
 * Must be called by IS code before passing data to FC code.
 */
export function parseCreateNoteInput(raw: unknown): ParseResult<CreateNoteInput> {
  const result = createNoteInputSchema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      error: result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    };
  }
  return { ok: true, value: result.data };
}
