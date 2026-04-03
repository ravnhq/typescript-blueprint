// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

function stubHandler(): void {
  // intentional no-op for test stubs
}

interface TextInputMockProps {
  readonly placeholder?: string;
  readonly value?: string;
  readonly onChangeText?: (text: string) => void;
  readonly style?: unknown;
  readonly multiline?: boolean;
}

vi.mock('react-native', () => ({
  View: ({ children }: { readonly children: React.ReactNode }) => <div>{children}</div>,
  Text: ({ children }: { readonly children: React.ReactNode }) => <span>{children}</span>,
  TextInput: (props: TextInputMockProps) => {
    function handleChange(e: unknown): void {
      const target = (e as { target: { value: string } }).target;
      props.onChangeText?.(target.value);
    }
    return <input placeholder={props.placeholder} value={props.value} onChange={handleChange} />;
  },
  Pressable: ({
    children,
    onPress,
  }: {
    readonly children: React.ReactNode;
    readonly onPress?: () => void;
  }) => (
    <button type="button" onClick={onPress}>
      {children}
    </button>
  ),
  StyleSheet: { create: (s: Record<string, unknown>) => s },
}));

import { NoteForm } from './note-form';

describe('NoteForm', () => {
  it('renders title and body inputs', () => {
    render(<NoteForm onSubmit={stubHandler} />);
    expect(screen.getByPlaceholderText('Note title')).toBeDefined();
    expect(screen.getByPlaceholderText('Note body')).toBeDefined();
  });

  it('renders submit button', () => {
    render(<NoteForm onSubmit={stubHandler} />);
    expect(screen.getByText('Add Note')).toBeDefined();
  });

  it('calls onSubmit with valid input', async () => {
    const handleSubmit = vi.fn();
    render(<NoteForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByPlaceholderText('Note title'), {
      target: { value: 'My Title' },
    });
    fireEvent.change(screen.getByPlaceholderText('Note body'), {
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

    fireEvent.change(screen.getByPlaceholderText('Note title'), {
      target: { value: 'My Title' },
    });
    fireEvent.change(screen.getByPlaceholderText('Note body'), {
      target: { value: 'My Body' },
    });
    fireEvent.click(screen.getByText('Add Note'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Note title')).toHaveProperty('value', '');
    });
  });

  it('shows error when submit fails', async () => {
    const handleSubmit = vi.fn().mockRejectedValueOnce(new Error('Network error'));
    render(<NoteForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByPlaceholderText('Note title'), {
      target: { value: 'My Title' },
    });
    fireEvent.change(screen.getByPlaceholderText('Note body'), {
      target: { value: 'My Body' },
    });
    fireEvent.click(screen.getByText('Add Note'));

    await waitFor(() => {
      expect(screen.queryByText('Failed to submit note')).toBeTruthy();
    });
  });

  it('shows fallback error when validation issue has no message', async () => {
    const shared = await import('@blueprint/shared');
    vi.spyOn(shared.createNoteInputSchema, 'safeParse').mockReturnValueOnce({
      success: false,
      error: {
        issues: [{ message: undefined }],
      },
    } as unknown as ReturnType<typeof shared.createNoteInputSchema.safeParse>);

    render(<NoteForm onSubmit={stubHandler} />);

    fireEvent.change(screen.getByPlaceholderText('Note title'), {
      target: { value: 'x' },
    });
    fireEvent.click(screen.getByText('Add Note'));

    expect(screen.queryByText('Invalid input')).toBeTruthy();
    vi.restoreAllMocks();
  });

  it('shows error for empty title', () => {
    render(<NoteForm onSubmit={stubHandler} />);
    fireEvent.click(screen.getByText('Add Note'));
    expect(screen.queryByText(/too small/i)).toBeTruthy();
  });
});
