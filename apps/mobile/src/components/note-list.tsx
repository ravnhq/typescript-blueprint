import type { ReactNode } from 'react';
import { FlatList, Text, View, StyleSheet } from 'react-native';
import type { Note } from '@blueprint/shared';
import { formatDate, parseISO } from '@blueprint/shared';

interface NoteListProps {
  readonly notes: readonly Note[];
}

const styles = StyleSheet.create({
  empty: {
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
  },
  item: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  body: {
    color: '#555',
    marginTop: 4,
  },
  date: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
});

export function NoteList({ notes }: NoteListProps): ReactNode {
  if (notes.length === 0) {
    return <Text style={styles.empty}>No notes yet. Create one above!</Text>;
  }

  return (
    <FlatList
      data={notes}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.body}>{item.body}</Text>
          <Text style={styles.date}>
            {formatDate(parseISO(item.createdAt), 'MMM d, yyyy HH:mm')}
          </Text>
        </View>
      )}
    />
  );
}
