import { createHmac, timingSafeEqual } from 'node:crypto';
import { PAYMENT_METHOD, appointmentFinancials } from '@belago/shared';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { HttpError } from '../errors.js';
import type { Repo } from '../repo.js';

const paymentEventSchema = z.object({
  providerRef: z.string().min(1),
  appointmentId: z.string().uuid(),
  method: z.enum(PAYMENT_METHOD),
  amount: z.number().positive(),
});

export function signPayload(secret: string, rawBody: string): string {
  return createHmac('sha256', secret).update(rawBody).digest('hex');
}

function validSignature(secret: string, rawBody: string, header: unknown): boolean {
  if (typeof header !== 'string' || !/^[0-9a-f]+$/i.test(header)) return false;
  const expected = Buffer.from(signPayload(secret, rawBody), 'hex');
  const given = Buffer.from(header, 'hex');
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Webhook de confirmação de pagamento, agnóstico de provedor: espera o corpo JSON acima assinado
 * com HMAC-SHA256 (hex) do corpo bruto no header `x-signature`. Ao escolher o provedor real
 * (decisão pendente do plano), basta um adaptador que traduza o payload dele para este formato.
 */
export const webhookRoutes =
  (repo: Repo, secret: string): FastifyPluginAsync =>
  async (app) => {
    // A assinatura cobre o corpo bruto; este parser (só neste escopo) o preserva.
    app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
      (req as { rawBody?: string }).rawBody = body as string;
      try {
        done(null, JSON.parse(body as string));
      } catch {
        done(new HttpError(400, 'JSON inválido', 'invalid_request'));
      }
    });

    app.post('/webhooks/payments', async (req, reply) => {
      const raw = (req as { rawBody?: string }).rawBody ?? '';
      if (!validSignature(secret, raw, req.headers['x-signature'])) {
        throw new HttpError(401, 'Assinatura inválida', 'invalid_signature');
      }

      const parsed = paymentEventSchema.safeParse(req.body);
      if (!parsed.success) throw new HttpError(400, 'Evento inválido', 'invalid_request');
      const event = parsed.data;

      const appt = await repo.getAppointment(event.appointmentId);
      if (!appt) throw new HttpError(404, 'Agendamento não encontrado', 'not_found');
      if (appt.status === 'cancelado') {
        throw new HttpError(409, 'Agendamento cancelado; pagamento requer estorno manual', 'appointment_cancelled');
      }

      // Valor e comissão são recalculados aqui; o que o provedor diz só é conferido, não confiado.
      const money = appointmentFinancials(appt.price, appt.homeFee > 0 ? 'domicilio' : 'estudio');
      if (Math.round(event.amount * 100) !== Math.round(money.total * 100)) {
        throw new HttpError(422, 'Valor pago diverge do valor do agendamento', 'amount_mismatch');
      }

      const recorded = await repo.recordPayment({
        appointmentId: appt.id,
        amount: money.total,
        platformFee: money.platformFee,
        netAmount: money.net,
        method: event.method,
        providerRef: event.providerRef,
      });

      if (recorded) {
        for (const id of [appt.clientId, appt.professionalId]) {
          repo
            .notify(id, 'Pagamento confirmado', 'O pagamento do agendamento foi confirmado.')
            .catch((err) => req.log.warn({ err }, 'falha ao notificar'));
        }
      }
      // Reentrega do mesmo evento é idempotente: responde 200 para o provedor parar de reenviar.
      return reply.status(200).send({ received: true, duplicate: !recorded });
    });
  };
