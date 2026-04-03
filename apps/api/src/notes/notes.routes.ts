import { Hono } from 'hono';
import { createNoteInputSchema, ErrorCode, formatZodError, type NoteId } from '@blueprint/shared';
import { logger } from '../logger.js';
import type { NotesStore } from './notes.store.js';

const UUID_REGEX = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

export function createNotesRoutes(notesStore: NotesStore): Hono {
  const notes = new Hono();

  notes.get('/', (c) => {
    logger.info('Listing all notes');
    const result = notesStore.getAllNotes();
    if (result.isErr()) {
      return c.json(
        { error: { code: ErrorCode.INTERNAL_ERROR, message: 'Failed to retrieve notes' } },
        500,
      );
    }
    return c.json({ data: result.value });
  });

  notes.get('/:id', (c) => {
    const id = c.req.param('id');
    if (!UUID_REGEX.test(id)) {
      return c.json(
        {
          error: { code: ErrorCode.BAD_REQUEST, message: 'Invalid note ID format, expected UUID' },
        },
        400,
      );
    }
    logger.info({ noteId: id }, 'Fetching note by id');
    const result = notesStore.getNoteById(id as NoteId);
    if (result.isErr()) {
      return c.json({ error: { code: ErrorCode.NOT_FOUND, message: result.error.message } }, 404);
    }
    return c.json({ data: result.value });
  });

  notes.post('/', async (c) => {
    const body: unknown = await c.req.json();
    const parsed = createNoteInputSchema.safeParse(body);
    if (!parsed.success) {
      logger.warn({ issues: parsed.error.issues }, 'Invalid note input');
      return c.json(
        {
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Validation failed',
            details: formatZodError(parsed.error),
          },
        },
        400,
      );
    }
    const result = notesStore.createNote(parsed.data);
    if (result.isErr()) {
      return c.json(
        { error: { code: ErrorCode.INTERNAL_ERROR, message: result.error.message } },
        500,
      );
    }
    logger.info({ noteId: result.value.id }, 'Note created');
    return c.json({ data: result.value }, 201);
  });

  return notes;
}
