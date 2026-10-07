import type { AvailabilitySlotInput, BusyInterval } from '@belago/shared';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import {
  NothingToPayoutError,
  SlotTakenError,
  type AppointmentRecord,
  type AuthUser,
  type NewAppointment,
  type NewPayment,
  type PayoutRecord,
  type Repo,
  type ServiceRecord,
} from '../src/repo.js';

export const SECRET = 'segredo-de-teste-123456';

export const IDS = {
  client: '11111111-1111-4111-8111-111111111111',
  pro: '22222222-2222-4222-8222-222222222222',
  admin: '33333333-3333-4333-8333-333333333333',
  service: '44444444-4444-4444-8444-444444444444',
  otherService: '55555555-5555-4555-8555-555555555555',
  appt: '66666666-6666-4666-8666-666666666666',
};

export const TOKENS: Record<string, AuthUser> = {
  'tok-client': { id: IDS.client, role: 'cliente' },
  'tok-pro': { id: IDS.pro, role: 'profissional' },
  'tok-admin': { id: IDS.admin, role: 'admin' },
};

export const FUTURE_DATE = '2999-01-10';

/** Repo em memória: mesma porta que o Supabase, sem rede. Estado exposto para asserções. */
export class FakeRepo implements Repo {
  proStatus: string | null = 'ativa';
  maintenance = false;
  clientBlocked = false;
  services = new Map<string, ServiceRecord>([
    [
      IDS.service,
      {
        id: IDS.service,
        professionalId: IDS.pro,
        name: 'Corte',
        category: 'cabelo',
        durationMin: 60,
        price: 100,
        active: true,
      },
    ],
  ]);
  slots: AvailabilitySlotInput[] = [
    { time: '10:00', all: true, serviceIds: [] },
    { time: '11:00', all: true, serviceIds: [] },
    { time: '15:00', all: false, serviceIds: [IDS.otherService] },
  ];
  busy: BusyInterval[] = [];
  inserted: NewAppointment[] = [];
  raceOnInsert = false;
  appointments = new Map<string, AppointmentRecord>();
  payments: NewPayment[] = [];
  deletedAccounts: string[] = [];
  payouts = new Map<string, PayoutRecord>();
  hasPaymentsToPayout = true;
  notifications: Array<{ profileId: string; title: string }> = [];
  notifyFails = false;

  async getProfessionalStatus() {
    return this.proStatus;
  }
  async getService(id: string) {
    return this.services.get(id) ?? null;
  }
  async isMaintenanceMode() {
    return this.maintenance;
  }
  async isClientBlocked() {
    return this.clientBlocked;
  }
  async listDaySlots() {
    return this.slots;
  }
  async listBusyIntervals() {
    return this.busy;
  }
  async insertAppointment(input: NewAppointment) {
    if (this.raceOnInsert) throw new SlotTakenError();
    this.inserted.push(input);
    return { id: IDS.appt };
  }
  async getAppointment(id: string) {
    return this.appointments.get(id) ?? null;
  }
  async recordPayment(payment: NewPayment) {
    if (this.payments.some((p) => p.providerRef === payment.providerRef)) return false;
    this.payments.push(payment);
    return true;
  }
  async deleteAccount(userId: string) {
    this.deletedAccounts.push(userId);
  }
  async createPayout(professionalId: string): Promise<PayoutRecord> {
    if (!this.hasPaymentsToPayout) throw new NothingToPayoutError();
    const payout: PayoutRecord = { id: IDS.appt, professionalId, amount: 85, status: 'pendente' };
    this.payouts.set(payout.id, payout);
    return payout;
  }
  async processPayout(id: string) {
    const payout = this.payouts.get(id);
    if (!payout || payout.status !== 'pendente') return null;
    payout.status = 'processado';
    return payout;
  }
  async notify(profileId: string, title: string) {
    if (this.notifyFails) throw new Error('smtp fora do ar');
    this.notifications.push({ profileId, title });
  }
}

export async function makeApp(repo: FakeRepo = new FakeRepo()): Promise<{ app: FastifyInstance; repo: FakeRepo }> {
  const app = await buildApp({
    config: { webOrigins: ['http://localhost:5173'], paymentWebhookSecret: SECRET },
    authenticate: async (token) => TOKENS[token] ?? null,
    repo,
    logger: false,
  });
  return { app, repo };
}

export const bearer = (token: string) => ({ authorization: `Bearer ${token}` });
