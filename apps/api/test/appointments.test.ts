import { describe, expect, it } from 'vitest';
import { FUTURE_DATE, IDS, bearer, makeApp } from './helpers.js';

const body = (over: Record<string, unknown> = {}) => ({
  professionalId: IDS.pro,
  serviceId: IDS.service,
  scheduledDate: FUTURE_DATE,
  scheduledTime: '10:00',
  location: 'estudio',
  ...over,
});

const post = (app: Awaited<ReturnType<typeof makeApp>>['app'], payload: unknown, token = 'tok-client') =>
  app.inject({ method: 'POST', url: '/appointments', headers: bearer(token), payload: payload as object });

describe('POST /appointments', () => {
  it('rejeita sem token e com token inválido', async () => {
    const { app } = await makeApp();
    expect((await app.inject({ method: 'POST', url: '/appointments', payload: body() })).statusCode).toBe(401);
    expect((await post(app, body(), 'tok-desconhecido')).statusCode).toBe(401);
  });

  it('só clientes agendam', async () => {
    const { app } = await makeApp();
    expect((await post(app, body(), 'tok-pro')).statusCode).toBe(403);
    expect((await post(app, body(), 'tok-admin')).statusCode).toBe(403);
  });

  it('valida o corpo com o schema compartilhado', async () => {
    const { app } = await makeApp();
    expect((await post(app, body({ scheduledTime: '25:99' }))).statusCode).toBe(400);
    expect((await post(app, body({ professionalId: 'x' }))).statusCode).toBe(400);
  });

  it('cria o agendamento com snapshot e valores calculados no servidor', async () => {
    const { app, repo } = await makeApp();
    // Preço enviado pelo cliente é ignorado: o valor vem do serviço no banco.
    const res = await post(app, body({ price: 1, homeFee: 0 }));
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ price: 100, homeFee: 0, total: 100, platformFee: 15, netAmount: 85 });
    expect(repo.inserted[0]).toMatchObject({
      clientId: IDS.client,
      serviceName: 'Corte',
      category: 'cabelo',
      durationMin: 60,
      price: 100,
    });
    expect(repo.notifications).toEqual([{ profileId: IDS.pro, title: 'Novo agendamento' }]);
  });

  it('soma a taxa de deslocamento em domicílio e calcula a comissão sobre o total', async () => {
    const { app, repo } = await makeApp();
    const res = await post(app, body({ location: 'domicilio', address: 'Rua A, 10' }));
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ homeFee: 20, total: 120, platformFee: 18, netAmount: 102 });
    expect(repo.inserted[0]?.address).toBe('Rua A, 10');
  });

  it('não grava endereço para atendimento no estúdio', async () => {
    const { app, repo } = await makeApp();
    await post(app, body({ address: 'Rua A, 10' }));
    expect(repo.inserted[0]?.address).toBeNull();
  });

  it('recusa horário que não está na disponibilidade', async () => {
    const { app } = await makeApp();
    const res = await post(app, body({ scheduledTime: '09:00' }));
    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBe('slot_unavailable');
  });

  it('recusa horário liberado só para outro serviço', async () => {
    const { app } = await makeApp();
    expect((await post(app, body({ scheduledTime: '15:00' }))).statusCode).toBe(409);
  });

  it('recusa horário no passado', async () => {
    const { app } = await makeApp();
    expect((await post(app, body({ scheduledDate: '2000-01-01' }))).statusCode).toBe(409);
  });

  it('recusa conflito de duração com agendamento existente', async () => {
    const { app, repo } = await makeApp();
    repo.busy = [[9 * 60 + 30, 10 * 60 + 30]]; // 09:30–10:30 sobrepõe 10:00–11:00
    expect((await post(app, body())).statusCode).toBe(409);
    // 11:00 começa depois do fim do agendamento ocupado (10:30), então está livre.
    expect((await post(app, body({ scheduledTime: '11:00' }))).statusCode).toBe(201);
  });

  it('traduz a rejeição do banco por corrida em 409', async () => {
    const { app, repo } = await makeApp();
    repo.raceOnInsert = true;
    const res = await post(app, body());
    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBe('slot_unavailable');
  });

  it('recusa serviço inativo, de outra profissional ou inexistente', async () => {
    const { app, repo } = await makeApp();
    repo.services.get(IDS.service)!.active = false;
    expect((await post(app, body())).statusCode).toBe(409);
    repo.services.get(IDS.service)!.active = true;
    repo.services.get(IDS.service)!.professionalId = IDS.admin;
    expect((await post(app, body())).statusCode).toBe(404);
    expect((await post(app, body({ serviceId: IDS.otherService }))).statusCode).toBe(404);
  });

  it('recusa profissional não ativa e modo manutenção', async () => {
    const { app, repo } = await makeApp();
    repo.proStatus = 'suspensa';
    expect((await post(app, body())).statusCode).toBe(404);
    repo.proStatus = 'ativa';
    repo.maintenance = true;
    expect((await post(app, body())).statusCode).toBe(503);
  });

  it('recusa agendamento de cliente bloqueada', async () => {
    const { app, repo } = await makeApp();
    repo.clientBlocked = true;
    expect((await post(app, body())).statusCode).toBe(403);
    expect(repo.inserted).toHaveLength(0);
  });

  it('falha ao notificar não derruba o agendamento', async () => {
    const { app, repo } = await makeApp();
    repo.notifyFails = true;
    expect((await post(app, body())).statusCode).toBe(201);
  });
});
