import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { HttpError } from '../errors.js';
import { NothingToPayoutError, type Repo } from '../repo.js';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const createPayoutSchema = z
  .object({
    professionalId: z.string().uuid(),
    periodStart: isoDate,
    periodEnd: isoDate,
  })
  .refine((v) => v.periodStart <= v.periodEnd, { message: 'Período inválido' });

export const payoutRoutes =
  (repo: Repo): FastifyPluginAsync =>
  async (app) => {
    app.addHook('preHandler', async (req) => {
      if (req.user!.role !== 'admin') throw new HttpError(403, 'Acesso restrito à administração', 'forbidden');
    });

    app.post('/payouts', async (req, reply) => {
      const parsed = createPayoutSchema.safeParse(req.body);
      if (!parsed.success) throw new HttpError(400, 'Dados do repasse inválidos', 'invalid_request');
      try {
        const payout = await repo.createPayout(
          parsed.data.professionalId,
          parsed.data.periodStart,
          parsed.data.periodEnd,
        );
        return reply.status(201).send(payout);
      } catch (err) {
        if (err instanceof NothingToPayoutError) {
          throw new HttpError(422, 'Nenhum pagamento a repassar no período', 'nothing_to_payout');
        }
        throw err;
      }
    });

    app.post<{ Params: { id: string } }>('/payouts/:id/process', async (req) => {
      if (!z.string().uuid().safeParse(req.params.id).success) {
        throw new HttpError(400, 'Identificador inválido', 'invalid_request');
      }
      const payout = await repo.processPayout(req.params.id);
      if (!payout) throw new HttpError(409, 'Repasse inexistente ou já processado', 'conflict');
      repo
        .notify(payout.professionalId, 'Repasse processado', 'Seu repasse foi processado.')
        .catch((err) => req.log.warn({ err }, 'falha ao notificar profissional'));
      return payout;
    });
  };
