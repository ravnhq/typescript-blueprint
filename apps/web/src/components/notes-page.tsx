import type { ReactNode } from 'react';
import { useRouter, useLoaderData } from '@tanstack/react-router';
import type { Note, CreateNoteInput } from '@blueprint/shared';
import { NoteList } from './note-list.js';
import { NoteForm } from './note-form.js';
import { createNoteRequest, ApiRequestError } from '../lib/api.js';

export function NotesPage(): ReactNode {
  const notes: Note[] = useLoaderData({ from: '/notes' });
  const router = useRouter();

  async function handleCreate(input: CreateNoteInput): Promise<void> {
    await createNoteRequest(input);
    await router.invalidate();
  }

  return (
    <main style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
      <h1>Notes</h1>
      <NoteForm onSubmit={handleCreate} />
      <NoteList notes={notes} />
    </main>
  );
}

export function NotesPending(): ReactNode {
  return (
    <main style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
      <h1>Notes</h1>
      <p>Loading notes...</p>
    </main>
  );
}

export function NotesError({ error }: { readonly error: Error }): ReactNode {
  const message = isNotesLoadError(error)
    ? `Failed to load notes: ${error.message}`
    : 'An unexpected error occurred';

  return (
    <main style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
      <h1>Notes</h1>
      <p style={{ color: 'red' }}>{message}</p>
    </main>
  );
}

function isNotesLoadError(error: Error): boolean {
  if (error instanceof ApiRequestError || error instanceof TypeError) {
    return true;
  }

  return (
    'name' in error &&
    'message' in error &&
    typeof error.name === 'string' &&
    typeof error.message === 'string' &&
    error.name === 'ApiRequestError'
  );
}
