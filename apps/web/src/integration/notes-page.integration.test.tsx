import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreateNoteInput } from '@blueprint/shared';

const mocks = vi.hoisted(() => ({
  createNoteRequest: vi.fn<(input: CreateNoteInput) => Promise<void>>(),
  invalidate: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => () => ({}),
  useLoaderData: () => [
    { id: '1', title: 'Existing note', body: 'Saved', createdAt: '2026-04-03T12:00:00.000Z' },
  ],
  useRouter: () => ({ invalidate: mocks.invalidate }),
}));

vi.mock('../lib/api.js', () => ({
  ApiRequestError: class ApiRequestError extends Error {},
  createNoteRequest: mocks.createNoteRequest,
  fetchNotes: vi.fn(),
}));

import { NotesError, NotesPage } from '../components/notes-page.js';

describe('NotesPage integration', () => {
  beforeEach(() => {
    mocks.createNoteRequest.mockReset();
    mocks.invalidate.mockReset();
  });

  it('submits a note and invalidates the router', async () => {
    mocks.createNoteRequest.mockResolvedValueOnce(undefined);
    render(<NotesPage />);

    fireEvent.change(screen.getByLabelText('Note title'), {
      target: { value: 'New title' },
    });
    fireEvent.change(screen.getByLabelText('Note body'), {
      target: { value: 'New body' },
    });
    fireEvent.click(screen.getByText('Add Note'));

    await waitFor(() => {
      expect(mocks.createNoteRequest).toHaveBeenCalledWith({
        title: 'New title',
        body: 'New body',
      });
      expect(mocks.invalidate).toHaveBeenCalled();
    });
  });

  it('renders an actionable message for serialized API errors', () => {
    render(
      <NotesError
        error={
          {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error',
            name: 'ApiRequestError',
            status: 500,
          } as Error
        }
      />,
    );

    expect(screen.getByText('Failed to load notes: Internal server error')).toBeTruthy();
  });

  it('renders an actionable message for network failures', () => {
    render(<NotesError error={new TypeError('Failed to fetch')} />);

    expect(screen.getByText('Failed to load notes: Failed to fetch')).toBeTruthy();
  });
});
