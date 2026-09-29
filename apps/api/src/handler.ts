import type { IncomingMessage, ServerResponse } from 'node:http';
import type { FastifyInstance } from 'fastify';
import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createServiceClient, createSupabaseAuthenticator, createSupabaseRepo } from './supabaseRepo.js';

// Entrada serverless (Vercel). Reaproveita a instância entre invocações "quentes".
let appPromise: Promise<FastifyInstance> | undefined;

function getApp(): Promise<FastifyInstance> {
  appPromise ??= (async () => {
    const config = loadConfig();
    const db = createServiceClient(config);
    const app = await buildApp({
      config,
      authenticate: createSupabaseAuthenticator(db),
      repo: createSupabaseRepo(db),
    });
    await app.ready();
    return app;
  })();
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const app = await getApp();
  app.server.emit('request', req, res);
}
