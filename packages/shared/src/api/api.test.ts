import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  apiSuccessSchema,
  apiErrorSchema,
  type ApiSuccess,
  type ApiError,
  ErrorCode,
  formatZodError,
} from './index.js';

describe('API response envelope', () => {
  describe('apiSuccessSchema', () => {
    it('parses a success response with data', () => {
      const result = apiSuccessSchema.safeParse({ data: { id: '1', name: 'test' } });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data).toEqual({ id: '1', name: 'test' });
      }
    });

    it('parses a success response with array data', () => {
      const result = apiSuccessSchema.safeParse({ data: [1, 2, 3] });
      expect(result.success).toBe(true);
    });

    it('parses a success response with null data', () => {
      const result = apiSuccessSchema.safeParse({ data: null });
      expect(result.success).toBe(true);
    });

    it('rejects a response without data field', () => {
      const result = apiSuccessSchema.safeParse({ message: 'ok' });
      expect(result.success).toBe(false);
    });
  });

  describe('apiErrorSchema', () => {
    it('parses a basic error response', () => {
      const result = apiErrorSchema.safeParse({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input' },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.error.code).toBe('VALIDATION_ERROR');
        expect(result.data.error.message).toBe('Invalid input');
      }
    });

    it('parses an error response with details', () => {
      const result = apiErrorSchema.safeParse({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: [{ field: 'title', message: 'Required' }],
        },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.error.details).toHaveLength(1);
      }
    });

    it('rejects an error response without code', () => {
      const result = apiErrorSchema.safeParse({
        error: { message: 'something' },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('ErrorCode', () => {
    it('has all expected error codes', () => {
      expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND');
      expect(ErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
      expect(ErrorCode.BAD_REQUEST).toBe('BAD_REQUEST');
      expect(ErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(ErrorCode.TOO_MANY_REQUESTS).toBe('TOO_MANY_REQUESTS');
    });
  });

  describe('formatZodError', () => {
    it('formats Zod errors into detail objects', () => {
      const schema = z.object({
        title: z.string().min(1),
        body: z.string().max(10),
      });
      const result = schema.safeParse({ title: '', body: 'a'.repeat(11) });
      expect(result.success).toBe(false);
      if (!result.success) {
        const details = formatZodError(result.error);
        expect(details.length).toBeGreaterThan(0);
        expect(details[0]).toHaveProperty('field');
        expect(details[0]).toHaveProperty('message');
      }
    });
  });

  describe('type inference', () => {
    it('ApiSuccess type works with generic data', () => {
      const response: ApiSuccess<{ id: string }> = {
        data: { id: 'test' },
      };
      expect(apiSuccessSchema.safeParse(response).success).toBe(true);
    });

    it('ApiError type matches schema shape', () => {
      const response: ApiError = {
        error: { code: ErrorCode.NOT_FOUND, message: 'Not found' },
      };
      expect(apiErrorSchema.safeParse(response).success).toBe(true);
    });
  });
});
