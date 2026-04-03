import { z } from '@blueprint/shared';

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:8081',
  'exp://127.0.0.1:8081',
];

const apiConfigSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).optional(),
    PORT: z.coerce.number().int().min(1).max(65_535).optional(),
    API_ALLOWED_ORIGINS: z.string().optional(),
    API_AUTH_TOKEN: z.string().trim().min(1).optional(),
    API_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().optional(),
    API_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().optional(),
    NOTES_DATA_FILE: z.string().trim().min(1).optional(),
    API_LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .optional(),
  })
  .transform((raw) => ({
    allowedOrigins:
      raw.API_ALLOWED_ORIGINS?.split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin !== '') ?? DEFAULT_ALLOWED_ORIGINS,
    authToken: raw.API_AUTH_TOKEN,
    logLevel: raw.API_LOG_LEVEL ?? (raw.NODE_ENV === 'test' ? 'silent' : 'info'),
    nodeEnv: raw.NODE_ENV ?? 'development',
    notesDataFile: raw.NOTES_DATA_FILE ?? './data/notes.json',
    port: raw.PORT ?? 3001,
    rateLimitMaxRequests: raw.API_RATE_LIMIT_MAX_REQUESTS ?? 60,
    rateLimitWindowMs: raw.API_RATE_LIMIT_WINDOW_MS ?? 60_000,
  }))
  .superRefine((config, context) => {
    if (config.nodeEnv === 'production' && config.authToken === undefined) {
      context.addIssue({
        code: 'custom',
        message: 'API_AUTH_TOKEN is required when NODE_ENV=production',
        path: ['API_AUTH_TOKEN'],
      });
    }
  });

export type ApiConfig = z.infer<typeof apiConfigSchema>;

export function loadApiConfig(source: Record<string, string | undefined>): ApiConfig {
  return apiConfigSchema.parse(source);
}
