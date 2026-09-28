import cors from '@fastify/cors';
import type { Role } from '@belago/shared';
import Fastify, { type FastifyInstance } from 'fastify';
import type { Config } from './config.js';
import { HttpError } from './errors.js';
import type { Authenticator, Repo } from './repo.js';
import { accountRoutes } from './routes/account.js';
import { appointmentRoutes } from './routes/appointments.js';
import { payoutRoutes } from './routes/payouts.js';
import { webhookRoutes } from './routes/webhooks.js';

export interface AppDeps {
  config: Pick<Config, 'webOrigins' | 'paymentWebhookSecret'>;
  authenticate: Authenticator;
  repo: Repo;
  logger?: boolean;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: { id: string; role: Role };
  }
}

export async function buildApp(deps: AppDeps): Promise<FastifyInstance> {
  const app = Fastify({ logger: deps.logger ?? true });

  await app.register(cors, { origin: deps.config.webOrigins });

  app.setErrorHandler((err, req, reply) => {
    if (err instanceof HttpError) {
      return reply.status(err.status).send({ error: err.code, message: err.message });
    }
    if ((err as { validation?: unknown }).validation) {
      return reply.status(400).send({ error: 'invalid_request', message: 'Requisição inválida' });
    }
    req.log.error(err);
    return reply.status(500).send({ error: 'internal', message: 'Erro interno' });
  });

  app.get('/health', async () => ({ status: 'ok' }));

  await app.register(async (authed) => {
    authed.addHook('preHandler', async (req) => {
      const header = req.headers.authorization;
      const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
      if (!token) throw new HttpError(401, 'Não autenticado', 'unauthorized');
      const user = await deps.authenticate(token);
      if (!user) throw new HttpError(401, 'Sessão inválida ou expirada', 'unauthorized');
      req.user = user;
    });
    await authed.register(appointmentRoutes(deps.repo));
    await authed.register(accountRoutes(deps.repo));
    await authed.register(payoutRoutes(deps.repo));
  });

  // Fora do escopo autenticado: o provedor de pagamento se identifica por assinatura HMAC, não por JWT.
  await app.register(webhookRoutes(deps.repo, deps.config.paymentWebhookSecret));

  return app;
}
