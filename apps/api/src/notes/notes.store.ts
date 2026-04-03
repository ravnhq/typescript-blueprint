import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  ok,
  err,
  buildNote,
  sortNotesByDate,
  noteSchema,
  z,
  type Note,
  type NoteId,
  type CreateNoteInput,
  type Result,
} from '@blueprint/shared';

export interface NotesStore {
  clearNotes(): void;
  createNote(input: CreateNoteInput): Result<Note, Error>;
  getAllNotes(): Result<Note[], never>;
  getNoteById(id: NoteId): Result<Note, Error>;
}

interface NotesStoreOptions {
  readonly generateId?: () => NoteId;
  readonly now?: () => string;
}

interface FileBackedNotesStoreOptions extends NotesStoreOptions {
  readonly filePath: string;
}

const persistedNotesSchema = z.object({
  notes: z.array(noteSchema),
});

function createNoteRecord(
  input: CreateNoteInput,
  generateId: () => NoteId,
  now: () => string,
): Result<Note, Error> {
  return buildNote(generateId(), input, now());
}

function parsePersistedNotes(filePath: string): Note[] {
  if (!existsSync(filePath)) {
    return [];
  }

  const parsed = persistedNotesSchema.safeParse(JSON.parse(readFileSync(filePath, 'utf8')));
  return parsed.success ? parsed.data.notes : [];
}

function persistNotes(filePath: string, notes: Note[]): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify({ notes }, null, 2));
}

export function createInMemoryNotesStore(options: NotesStoreOptions = {}): NotesStore {
  const generateId = options.generateId ?? (() => randomUUID() as NoteId);
  const now = options.now ?? (() => new Date().toISOString());
  const notes = new Map<NoteId, Note>();

  return {
    clearNotes() {
      notes.clear();
    },
    createNote(input) {
      const result = createNoteRecord(input, generateId, now);
      if (result.isOk()) {
        notes.set(result.value.id as NoteId, result.value);
      }
      return result;
    },
    getAllNotes() {
      return ok(sortNotesByDate([...notes.values()]));
    },
    getNoteById(id) {
      const note = notes.get(id);
      if (note === undefined) {
        return err(new Error('Note not found'));
      }
      return ok(note);
    },
  };
}

export function createFileBackedNotesStore({
  filePath,
  generateId = () => randomUUID() as NoteId,
  now = () => new Date().toISOString(),
}: FileBackedNotesStoreOptions): NotesStore {
  return {
    clearNotes() {
      persistNotes(filePath, []);
    },
    createNote(input) {
      const result = createNoteRecord(input, generateId, now);
      if (result.isErr()) {
        return result;
      }

      const notes = parsePersistedNotes(filePath);
      notes.push(result.value);
      persistNotes(filePath, notes);
      return result;
    },
    getAllNotes() {
      return ok(sortNotesByDate(parsePersistedNotes(filePath)));
    },
    getNoteById(id) {
      const note = parsePersistedNotes(filePath).find((entry) => entry.id === id);
      if (note === undefined) {
        return err(new Error('Note not found'));
      }
      return ok(note);
    },
  };
}
