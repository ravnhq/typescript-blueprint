import { type ReactNode, useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Note, CreateNoteInput } from '@blueprint/shared';
import { NoteList } from '../src/components/note-list';
import { NoteForm } from '../src/components/note-form';
import { fetchNotes as fetchNotesRequest, createNoteRequest } from '../src/lib/api';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 16,
  },
  loading: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 16,
  },
});

export default function NotesScreen(): ReactNode {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setNotes(await fetchNotesRequest());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load notes';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  async function handleCreate(input: CreateNoteInput): Promise<void> {
    try {
      await createNoteRequest(input);
      await loadNotes();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create note';
      setError(message);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <NoteForm onSubmit={handleCreate} />
      {error !== '' && <Text style={styles.error}>{error}</Text>}
      {loading ? <Text style={styles.loading}>Loading notes...</Text> : <NoteList notes={notes} />}
    </SafeAreaView>
  );
}
