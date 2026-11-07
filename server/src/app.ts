import { Hono } from 'hono';
import type { HealthResponse } from '@fridge/shared';

export function createApp() {
  const app = new Hono();

  app.get('/health', (c) => c.json<HealthResponse>({ ok: true }));

  return app;
}
