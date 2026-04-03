// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

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
  Text: ({
    children,
    style: _style,
  }: {
    readonly children: React.ReactNode;
    readonly style?: unknown;
  }) => <span>{children}</span>,
  View: ({
    children,
    style: _style,
  }: {
    readonly children: React.ReactNode;
    readonly style?: unknown;
  }) => <div>{children}</div>,
  StyleSheet: { create: (s: Record<string, unknown>) => s },
}));

import type { Note, NoteId } from '@blueprint/shared';
import { NoteList } from './note-list';

describe('NoteList', () => {
  const mockNotes: Note[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001' as NoteId,
      title: 'First Note',
      body: 'Body of first note',
      createdAt: '2026-04-02T12:00:00.000Z',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002' as NoteId,
      title: 'Second Note',
      body: 'Body of second note',
      createdAt: '2026-04-02T13:00:00.000Z',
    },
  ];

  it('renders notes when provided', () => {
    render(<NoteList notes={mockNotes} />);
    expect(screen.getByText('First Note')).toBeDefined();
    expect(screen.getByText('Second Note')).toBeDefined();
  });

  it('shows note body content', () => {
    render(<NoteList notes={mockNotes} />);
    expect(screen.getByText('Body of first note')).toBeDefined();
  });

  it('shows formatted dates', () => {
    render(<NoteList notes={mockNotes} />);
    const dates = screen.getAllByText(/2026/);
    expect(dates).toHaveLength(2);
  });

  it('shows empty message when no notes', () => {
    render(<NoteList notes={[]} />);
    expect(screen.getByText('No notes yet. Create one above!')).toBeDefined();
  });
});
