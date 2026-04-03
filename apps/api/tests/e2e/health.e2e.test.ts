import { describe, it } from 'vitest';

// E2E tests require a running server.
// Run `pnpm dev` in apps/api before executing these.
// These are intentionally excluded from the unit/integration vitest config.
describe('API e2e - health endpoint', () => {
  it.todo('GET /health responds with 200 from live server');
});
