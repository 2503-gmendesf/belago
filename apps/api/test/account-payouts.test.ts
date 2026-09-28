import { describe, expect, it } from 'vitest';
import { IDS, bearer, makeApp } from './helpers.js';

describe('DELETE /account', () => {
  it('exige autenticação', async () => {
    const { app, repo } = await makeApp();
    expect((await app.inject({ method: 'DELETE', url: '/account' })).statusCode).toBe(401);
    expect(repo.deletedAccounts).toEqual([]);
  });

  it('exclui apenas a conta de quem chamou', async () => {
    const { app, repo } = await makeApp();
    const res = await app.inject({ method: 'DELETE', url: '/account', headers: bearer('tok-client') });
    expect(res.statusCode).toBe(204);
    expect(repo.deletedAccounts).toEqual([IDS.client]);
  });

  it('não deixa admin se autoexcluir', async () => {
    const { app, repo } = await makeApp();
    const res = await app.inject({ method: 'DELETE', url: '/account', headers: bearer('tok-admin') });
    expect(res.statusCode).toBe(403);
    expect(repo.deletedAccounts).toEqual([]);
  });
});

describe('/payouts', () => {
  const payload = { professionalId: IDS.pro, periodStart: '2026-09-01', periodEnd: '2026-09-15' };

  it('restringe a admin', async () => {
    const { app } = await makeApp();
    for (const token of ['tok-client', 'tok-pro']) {
      const res = await app.inject({ method: 'POST', url: '/payouts', headers: bearer(token), payload });
      expect(res.statusCode).toBe(403);
    }
  });

  it('cria repasse pendente', async () => {
    const { app } = await makeApp();
    const res = await app.inject({ method: 'POST', url: '/payouts', headers: bearer('tok-admin'), payload });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ professionalId: IDS.pro, amount: 85, status: 'pendente' });
  });

  it('valida período e devolve 422 quando não há o que repassar', async () => {
    const { app, repo } = await makeApp();
    const bad = await app.inject({
      method: 'POST',
      url: '/payouts',
      headers: bearer('tok-admin'),
      payload: { ...payload, periodStart: '2026-09-20' },
    });
    expect(bad.statusCode).toBe(400);
    repo.hasPaymentsToPayout = false;
    const empty = await app.inject({ method: 'POST', url: '/payouts', headers: bearer('tok-admin'), payload });
    expect(empty.statusCode).toBe(422);
  });

  it('processa uma única vez', async () => {
    const { app } = await makeApp();
    const admin = bearer('tok-admin');
    await app.inject({ method: 'POST', url: '/payouts', headers: admin, payload });
    const first = await app.inject({ method: 'POST', url: `/payouts/${IDS.appt}/process`, headers: admin });
    expect(first.statusCode).toBe(200);
    expect(first.json().status).toBe('processado');
    const again = await app.inject({ method: 'POST', url: `/payouts/${IDS.appt}/process`, headers: admin });
    expect(again.statusCode).toBe(409);
  });
});
