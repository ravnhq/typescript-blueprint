import { describe, it, expect } from 'vitest';
import { z } from './index.js';

describe('zod validation', () => {
  it('validates a string schema', () => {
    const schema = z.string().min(1);
    expect(schema.safeParse('hello').success).toBe(true);
    expect(schema.safeParse('').success).toBe(false);
  });

  it('validates an object schema', () => {
    const schema = z.object({ name: z.string(), age: z.number().int().positive() });
    expect(schema.safeParse({ name: 'Alice', age: 30 }).success).toBe(true);
    expect(schema.safeParse({ name: 'Alice', age: -1 }).success).toBe(false);
  });
});
