import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { loadApiConfig } from './config.js';
import { createLogger } from './logger.js';

const config = loadApiConfig(process.env);
const logger = createLogger(config);
const port = config.port;
const app = createApp({ config });

const server = serve({ fetch: app.fetch, port }, (info) => {
  logger.info(`Server running at http://localhost:${info.port.toString()}`);
});

function shutdown(signal: string): void {
  logger.info(`${signal} received, shutting down gracefully`);
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  shutdown('SIGINT');
});
