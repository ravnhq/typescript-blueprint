import type { ReactNode } from 'react';
import { Text, View, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    color: '#666',
  },
  link: {
    marginTop: 24,
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  linkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default function HomeScreen(): ReactNode {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Blueprint Mobile</Text>
      <Text style={styles.subtitle}>TypeScript monorepo blueprint — mobile app.</Text>
      <Link href="/notes" asChild>
        <Pressable style={styles.link}>
          <Text style={styles.linkText}>Notes</Text>
        </Pressable>
      </Link>
    </View>
  );
}
