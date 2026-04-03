import type { ReactNode } from 'react';
import type { Note } from '@blueprint/shared';
import { formatDate, parseISO } from '@blueprint/shared';

interface NoteListProps {
  readonly notes: readonly Note[];
}

export function NoteList({ notes }: NoteListProps): ReactNode {
  if (notes.length === 0) {
    return <p>No notes yet. Create one above!</p>;
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {notes.map((note) => (
        <li
          key={note.id}
          style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '8px',
          }}
        >
          <strong>{note.title}</strong>
          <p style={{ margin: '4px 0', color: '#555' }}>{note.body}</p>
          <small style={{ color: '#999' }}>
            {formatDate(parseISO(note.createdAt), 'MMM d, yyyy HH:mm')}
          </small>
        </li>
      ))}
    </ul>
  );
}
