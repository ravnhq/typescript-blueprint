import { describe, it, expect, vi } from 'vitest';

// Mock React Native for vitest (runs in Node, not on device)
vi.mock('react-native', () => ({
  Text: 'Text',
  View: 'View',
  StyleSheet: { create: (styles: Record<string, unknown>) => styles },
}));

describe('Greeting', () => {
  it('is a placeholder until RNTL is configured', () => {
    expect(true).toBe(true);
  });
});
