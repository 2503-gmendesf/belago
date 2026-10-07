import { describe, expect, it } from 'vitest';
import { signPayload } from '../src/routes/webhooks.js';
import { IDS, SECRET, makeApp } from './helpers.js';

const event = { providerRef: 'pay_1', appointmentId: IDS.appt, method: 'pix', amount: 100 };

async function setup() {
  const ctx = await makeApp();
  ctx.repo.appointments.set(IDS.appt, {
    id: IDS.appt,
    clientId: IDS.client,
    professionalId: IDS.pro,
    status: 'pendente',
    price: 100,
    homeFee: 0,
  });
  const send = (payload: object, signature?: string) => {
    const raw = JSON.stringify(payload);
    return ctx.app.inject({
      method: 'POST',
      url: '/webhooks/payments',
      headers: { 'content-type': 'application/json', 'x-signature': signature ?? signPayload(SECRET, raw) },
      payload: raw,
    });
  };
  return { ...ctx, send };
}

describe('POST /webhooks/payments', () => {
  it('recusa assinatura ausente, inválida ou de outro segredo', async () => {
    const { send, repo } = await setup();
    expect((await send(event, 'zz')).statusCode).toBe(401);
    expect((await send(event, 'ab'.repeat(32))).statusCode).toBe(401);
    expect((await send(event, signPayload('outro-segredo-qualquer', JSON.stringify(event)))).statusCode).toBe(401);
    expect(repo.payments).toEqual([]);
  });

  it('recusa quando o corpo foi alterado depois de assinado', async () => {
    const { app, repo } = await setup();
    const signature = signPayload(SECRET, JSON.stringify(event));
    const res = await app.inject({
      method: 'POST',
      url: '/webhooks/payments',
      headers: { 'content-type': 'application/json', 'x-signature': signature },
      payload: JSON.stringify({ ...event, amount: 1 }),
    });
    expect(res.statusCode).toBe(401);
    expect(repo.payments).toEqual([]);
  });

  it('registra o pagamento com comissão calculada no servidor', async () => {
    const { send, repo } = await setup();
    const res = await send(event);
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ received: true, duplicate: false });
    expect(repo.payments[0]).toMatchObject({ amount: 100, platformFee: 15, netAmount: 85, providerRef: 'pay_1' });
    expect(repo.notifications.map((n) => n.profileId).sort()).toEqual([IDS.client, IDS.pro].sort());
  });

  it('é idempotente na reentrega do mesmo evento', async () => {
    const { send, repo } = await setup();
    await send(event);
    const again = await send(event);
    expect(again.statusCode).toBe(200);
    expect(again.json().duplicate).toBe(true);
    expect(repo.payments).toHaveLength(1);
  });

  it('recusa valor divergente do agendamento', async () => {
    const { send, repo } = await setup();
    expect((await send({ ...event, amount: 50 })).statusCode).toBe(422);
    expect(repo.payments).toEqual([]);
  });

  it('recusa agendamento inexistente ou cancelado', async () => {
    const { send, repo } = await setup();
    expect((await send({ ...event, appointmentId: IDS.client })).statusCode).toBe(404);
    repo.appointments.get(IDS.appt)!.status = 'cancelado';
    expect((await send(event)).statusCode).toBe(409);
  });

  it('considera a taxa de deslocamento no valor esperado', async () => {
    const { send, repo } = await setup();
    repo.appointments.get(IDS.appt)!.homeFee = 20;
    expect((await send(event)).statusCode).toBe(422);
    expect((await send({ ...event, amount: 120, providerRef: 'pay_2' })).statusCode).toBe(200);
    expect(repo.payments[0]).toMatchObject({ amount: 120, platformFee: 18, netAmount: 102 });
  });

  it('usa a comissão vigente e a taxa de deslocamento gravada no agendamento', async () => {
    const { send, repo } = await setup();
    // Agendado quando a taxa era R$ 20; o admin sobe para R$ 50 antes do pagamento.
    repo.appointments.get(IDS.appt)!.homeFee = 20;
    repo.rates = { commissionRate: 0.2, homeFee: 50, lateCancelPenaltyRate: 0.3 };
    expect((await send({ ...event, amount: 120 })).statusCode).toBe(200);
    expect(repo.payments[0]).toMatchObject({ amount: 120, platformFee: 24, netAmount: 96 });
  });

  it('rejeita evento malformado', async () => {
    const { send } = await setup();
    expect((await send({ ...event, method: 'boleto' })).statusCode).toBe(400);
  });
});
