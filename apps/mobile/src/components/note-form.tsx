import { type ReactNode, useState } from 'react';
import { View, TextInput, Text, Pressable, StyleSheet } from 'react-native';
import { createNoteInputSchema, type CreateNoteInput } from '@blueprint/shared';

interface NoteFormProps {
  readonly onSubmit: (input: CreateNoteInput) => Promise<void> | void;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  bodyInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 8,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    marginBottom: 8,
  },
});

export function NoteForm({ onSubmit }: NoteFormProps): ReactNode {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(): Promise<void> {
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
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Note title"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.bodyInput}
        placeholder="Note body"
        value={body}
        onChangeText={setBody}
        multiline
      />
      {error !== '' && <Text style={styles.error}>{error}</Text>}
      <Pressable
        style={submitting ? styles.buttonDisabled : styles.button}
        disabled={submitting}
        onPress={() => {
          void handleSubmit();
        }}
      >
        <Text style={styles.buttonText}>{submitting ? 'Adding...' : 'Add Note'}</Text>
      </Pressable>
    </View>
  );
}
