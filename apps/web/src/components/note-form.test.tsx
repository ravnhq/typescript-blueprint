import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NoteForm } from './note-form.js';

function noop(): void {
  // intentional no-op for test stubs
}

describe('NoteForm', () => {
  it('renders title and body inputs', () => {
    render(<NoteForm onSubmit={noop} />);
    expect(screen.getByLabelText('Note title')).toBeDefined();
    expect(screen.getByLabelText('Note body')).toBeDefined();
  });

  it('renders submit button', () => {
    render(<NoteForm onSubmit={noop} />);
    expect(screen.getByText('Add Note')).toBeDefined();
  });

  it('calls onSubmit with valid input', async () => {
    const handleSubmit = vi.fn();
    render(<NoteForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText('Note title'), {
      target: { value: 'My Title' },
    });
    fireEvent.change(screen.getByLabelText('Note body'), {
      target: { value: 'My Body' },
    });
    fireEvent.click(screen.getByText('Add Note'));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        title: 'My Title',
        body: 'My Body',
      });
    });
  });

  it('clears inputs after successful async submit', async () => {
    const handleSubmit = vi.fn().mockResolvedValueOnce(undefined);
    render(<NoteForm onSubmit={handleSubmit} />);

    const titleInput: HTMLInputElement = screen.getByLabelText('Note title');
    const bodyInput: HTMLTextAreaElement = screen.getByLabelText('Note body');

    fireEvent.change(titleInput, { target: { value: 'My Title' } });
    fireEvent.change(bodyInput, { target: { value: 'My Body' } });
    fireEvent.click(screen.getByText('Add Note'));

    await waitFor(() => {
      expect(titleInput.value).toBe('');
      expect(bodyInput.value).toBe('');
    });
  });

  it('does not clear inputs when submit fails', async () => {
    const handleSubmit = vi.fn().mockRejectedValueOnce(new Error('Network error'));
    render(<NoteForm onSubmit={handleSubmit} />);

    const titleInput: HTMLInputElement = screen.getByLabelText('Note title');
    const bodyInput: HTMLTextAreaElement = screen.getByLabelText('Note body');

    fireEvent.change(titleInput, { target: { value: 'My Title' } });
    fireEvent.change(bodyInput, { target: { value: 'My Body' } });
    fireEvent.click(screen.getByText('Add Note'));

    await waitFor(() => {
      expect(screen.getByText('Failed to submit note')).toBeDefined();
    });
    expect(titleInput.value).toBe('My Title');
    expect(bodyInput.value).toBe('My Body');
  });

  it('shows fallback error when validation issue has no message', async () => {
    const { createNoteInputSchema } = await import('@blueprint/shared');
    vi.spyOn(createNoteInputSchema, 'safeParse').mockReturnValueOnce({
      success: false,
      error: {
        issues: [{ message: undefined }],
      },
    } as unknown as ReturnType<typeof createNoteInputSchema.safeParse>);

    render(<NoteForm onSubmit={noop} />);

    fireEvent.change(screen.getByLabelText('Note title'), {
      target: { value: 'x' },
    });
    fireEvent.click(screen.getByText('Add Note'));

    expect(screen.getByText('Invalid input')).toBeDefined();
    vi.restoreAllMocks();
  });

  it('shows error for empty title', () => {
    render(<NoteForm onSubmit={noop} />);
    fireEvent.click(screen.getByText('Add Note'));
    expect(screen.queryByText(/too small/i)).toBeTruthy();
  });
});
