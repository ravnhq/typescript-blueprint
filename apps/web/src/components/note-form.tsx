import { type ReactNode, useState } from 'react';
import { createNoteInputSchema, type CreateNoteInput } from '@blueprint/shared';

interface NoteFormProps {
  readonly onSubmit: (input: CreateNoteInput) => Promise<void> | void;
}

export function NoteForm({ onSubmit }: NoteFormProps): ReactNode {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.SyntheticEvent): Promise<void> {
    event.preventDefault();
    setError('');
    const parsed = createNoteInputSchema.safeParse({ title, body });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(parsed.data);
      setTitle('');
      setBody('');
    } catch {
      setError('Failed to submit note');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      style={{ marginBottom: '24px' }}
    >
      <div style={{ marginBottom: '8px' }}>
        <input
          type="text"
          placeholder="Note title"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
          }}
          aria-label="Note title"
          style={{ width: '100%', padding: '8px', fontSize: '16px' }}
        />
      </div>
      <div style={{ marginBottom: '8px' }}>
        <textarea
          placeholder="Note body"
          value={body}
          onChange={(event) => {
            setBody(event.target.value);
          }}
          aria-label="Note body"
          rows={3}
          style={{ width: '100%', padding: '8px', fontSize: '14px' }}
        />
      </div>
      {error !== '' && <p style={{ color: 'red', margin: '4px 0' }}>{error}</p>}
      <button type="submit" disabled={submitting} style={{ padding: '8px 16px', fontSize: '14px' }}>
        {submitting ? 'Adding...' : 'Add Note'}
      </button>
    </form>
  );
}
