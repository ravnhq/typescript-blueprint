import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requestId, type RequestIdVariables } from 'hono/request-id';
import { z, ErrorCode } from '@blueprint/shared';
import { loadApiConfig, type ApiConfig } from './config.js';
import { createLogger } from './logger.js';
import { createNotesRoutes } from './notes/notes.routes.js';
import { createFileBackedNotesStore, type NotesStore } from './notes/notes.store.js';

export const healthResponseSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
});

interface CreateAppOptions {
  readonly config?: ApiConfig;
  readonly notesStore?: NotesStore;
}

type AppVariables = RequestIdVariables;

export function createApp(options: CreateAppOptions = {}): Hono<{ Variables: AppVariables }> {
  const config = options.config ?? loadApiConfig(process.env);
  const pinoLogger = createLogger(config);
  const notesStore =
    options.notesStore ?? createFileBackedNotesStore({ filePath: config.notesDataFile });
  const app = new Hono<{ Variables: AppVariables }>();
  const requestCounts = new Map<string, { count: number; resetAt: number }>();

  app.use('*', requestId());
  app.use('*', async (c, next) => {
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('Referrer-Policy', 'no-referrer');
    c.header('Cross-Origin-Resource-Policy', 'same-site');
    await next();
  });
  app.use(
    '*',
    cors({
      allowHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      credentials: true,
      exposeHeaders: ['Retry-After', 'X-Request-Id'],
      origin: (origin) => {
        if (origin === '') {
          return config.allowedOrigins[0] ?? '';
        }

        return config.allowedOrigins.includes(origin) ? origin : null;
      },
    }),
  );
  app.use('*', async (c, next) => {
    const requestIdentifier = c.req.header('x-forwarded-for') ?? 'anonymous';
    const now = Date.now();
    const existing = requestCounts.get(requestIdentifier);

    if (existing !== undefined && existing.resetAt > now) {
      if (existing.count >= config.rateLimitMaxRequests) {
        c.header('Retry-After', Math.ceil((existing.resetAt - now) / 1000).toString());
        return c.json(
          {
            error: {
              code: ErrorCode.TOO_MANY_REQUESTS,
              message: 'Rate limit exceeded',
            },
          },
          429,
        );
      }

      existing.count += 1;
    } else {
      requestCounts.set(requestIdentifier, {
        count: 1,
        resetAt: now + config.rateLimitWindowMs,
      });
    }

    return next();
  });
  app.use('/notes', async (c, next) => {
    if (config.authToken === undefined) {
      return next();
    }

    if (c.req.header('authorization') !== `Bearer ${config.authToken}`) {
      return c.json(
        {
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'Missing or invalid API token',
          },
        },
        401,
      );
    }

    return next();
  });
  app.use('/notes/*', async (c, next) => {
    if (config.authToken === undefined) {
      return next();
    }

    if (c.req.header('authorization') !== `Bearer ${config.authToken}`) {
      return c.json(
        {
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'Missing or invalid API token',
          },
        },
        401,
      );
    }

    return next();
  });

  app.notFound((c) => {
    return c.json(
      {
        error: {
          code: ErrorCode.NOT_FOUND,
          message: `Route not found: ${c.req.method} ${c.req.path}`,
        },
      },
      404,
    );
  });

  app.onError((error, c) => {
    if (error instanceof SyntaxError) {
      return c.json(
        { error: { code: ErrorCode.BAD_REQUEST, message: 'Malformed JSON in request body' } },
        400,
      );
    }

    pinoLogger.error({ err: error, requestId: c.get('requestId') }, 'Unhandled error');

    return c.json(
      { error: { code: ErrorCode.INTERNAL_ERROR, message: 'Internal server error' } },
      500,
    );
  });

  app.get('/health', (c) => {
    pinoLogger.info({ requestId: c.get('requestId') }, 'Health check requested');
    const response = healthResponseSchema.parse({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
    return c.json(response);
  });

  app.get('/', (c) => {
    return c.json({ data: { message: 'API is running' } });
  });

  app.route('/notes', createNotesRoutes(notesStore));

  return app;
}
