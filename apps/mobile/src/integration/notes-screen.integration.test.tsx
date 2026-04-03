// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiMocks = vi.hoisted(() => ({
  createNoteRequest: vi.fn<(input: { title: string; body: string }) => Promise<void>>(),
  fetchNotes: vi.fn<
    () => Promise<
      {
        id: string;
        title: string;
        body: string;
        createdAt: string;
      }[]
    >
  >(),
}));

vi.mock('react-native', () => ({
  FlatList: ({
    data,
    renderItem,
    keyExtractor,
  }: {
    readonly data: readonly Record<string, unknown>[];
    readonly renderItem: (info: { item: Record<string, unknown> }) => React.ReactNode;
    readonly keyExtractor: (item: Record<string, unknown>) => string;
  }) => (
    <div>
      {data.map((item) => (
        <div key={keyExtractor(item)}>{renderItem({ item })}</div>
      ))}
    </div>
  ),
  SafeAreaView: ({ children }: { readonly children: React.ReactNode }) => <div>{children}</div>,
  View: ({ children }: { readonly children: React.ReactNode }) => <div>{children}</div>,
  Text: ({ children }: { readonly children: React.ReactNode }) => <span>{children}</span>,
  TextInput: ({
    placeholder,
    value,
    onChangeText,
  }: {
    readonly placeholder?: string;
    readonly value?: string;
    readonly onChangeText?: (value: string) => void;
  }) => (
    <input
      placeholder={placeholder}
      value={value}
      onChange={(event) => {
        onChangeText?.((event.target as unknown as { value: string }).value);
      }}
    />
  ),
  Pressable: ({
    children,
    onPress,
  }: {
    readonly children: React.ReactNode;
    readonly onPress?: () => void;
  }) => (
    <button
      type="button"
      onClick={() => {
        onPress?.();
      }}
    >
      {children}
    </button>
  ),
  StyleSheet: { create: (styles: Record<string, unknown>) => styles },
}));

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { readonly children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../lib/api', () => ({
  createNoteRequest: apiMocks.createNoteRequest,
  fetchNotes: apiMocks.fetchNotes,
}));

import NotesScreen from '../../app/notes';

describe('NotesScreen integration', () => {
  beforeEach(() => {
    apiMocks.fetchNotes.mockReset();
    apiMocks.createNoteRequest.mockReset();
  });

  it('loads notes and refreshes after creating one', async () => {
    apiMocks.fetchNotes
      .mockResolvedValueOnce([
        {
          id: '1',
          title: 'First note',
          body: 'Saved',
          createdAt: '2026-04-03T12:00:00.000Z',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: '1',
          title: 'First note',
          body: 'Saved',
          createdAt: '2026-04-03T12:00:00.000Z',
        },
        {
          id: '2',
          title: 'Second note',
          body: 'Created',
          createdAt: '2026-04-03T12:01:00.000Z',
        },
      ]);
    apiMocks.createNoteRequest.mockResolvedValueOnce(undefined);

    render(<NotesScreen />);

    await waitFor(() => {
      expect(screen.getByText('First note')).toBeDefined();
    });

    fireEvent.change(screen.getByPlaceholderText('Note title'), {
      target: { value: 'Second note' },
    });
    fireEvent.change(screen.getByPlaceholderText('Note body'), {
      target: { value: 'Created' },
    });
    fireEvent.click(screen.getByText('Add Note'));

    await waitFor(() => {
      expect(apiMocks.createNoteRequest).toHaveBeenCalledWith({
        title: 'Second note',
        body: 'Created',
      });
      expect(screen.getByText('Second note')).toBeDefined();
    });
  });
});
