import type { Note } from '@blueprint/shared';
import { createFileRoute } from '@tanstack/react-router';
import { NotesPage, NotesError, NotesPending } from '../components/notes-page.js';
import { fetchNotes } from '../lib/api.js';

export const Route = createFileRoute('/notes')({
  loader: async (): Promise<Note[]> => fetchNotes(),
  pendingComponent: NotesPending,
  errorComponent: NotesError,
  component: NotesPage,
});
