import { describe, it, expect } from 'vitest';
import { ok, err } from './index.js';

describe('neverthrow utilities', () => {
  it('creates an Ok result', () => {
    const result = ok(42);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBe(42);
    }
  });

  it('creates an Err result', () => {
    const result = err(new Error('something went wrong'));
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe('something went wrong');
    }
  });
});
