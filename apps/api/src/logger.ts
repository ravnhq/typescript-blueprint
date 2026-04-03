import pino from 'pino';
import type { ApiConfig } from './config.js';

export function createLogger(config: Pick<ApiConfig, 'logLevel' | 'nodeEnv'>) {
  return pino({
    level: config.logLevel,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers["x-api-key"]',
        'headers.authorization',
        'headers["x-api-key"]',
      ],
      remove: true,
    },
    ...(config.nodeEnv === 'production' || config.logLevel === 'silent'
      ? {}
      : {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
            },
          },
        }),
  });
}

const runtimeNodeEnv =
  process.env['NODE_ENV'] === 'production' ||
  process.env['NODE_ENV'] === 'test' ||
  process.env['NODE_ENV'] === 'development'
    ? process.env['NODE_ENV']
    : 'development';

export const logger = createLogger({
  logLevel: runtimeNodeEnv === 'test' ? 'silent' : 'info',
  nodeEnv: runtimeNodeEnv,
});
