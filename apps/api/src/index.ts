import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createServiceClient, createSupabaseAuthenticator, createSupabaseRepo } from './supabaseRepo.js';

const config = loadConfig();
const db = createServiceClient(config);

const app = await buildApp({
  config,
  authenticate: createSupabaseAuthenticator(db),
  repo: createSupabaseRepo(db),
});

app.listen({ port: config.port, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
