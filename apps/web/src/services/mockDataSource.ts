import { DEFAULT_FAVORITE_IDS, PROFESSIONALS } from '../features/discovery/fixtures.js';
import { activeServices, availableTimes, nextAvailableDays } from '../features/discovery/utils.js';
import * as appointmentsStore from './appointmentsStore.js';
import * as availabilityStore from './availabilityStore.js';
import * as professionalStore from './professionalStore.js';
import * as expensesStore from './expensesStore.js';
import * as adminStore from './adminStore.js';
import { ADMIN_FINANCE } from '../features/admin/fixtures.js';
import type { AuthUser, DataSource } from './types.js';

const STORAGE_KEY = 'belago:mock-session';

/** Vincula o usuário demo de cada papel à profissional correspondente nas fixtures. */
const PROFESSIONAL_ID_BY_USER: Record<string, string> = {
  'demo-profissional': 'p0',
};

function favoritesKey(clientId: string): string {
  return `belago:mock-favs:${clientId}`;
}

function readFavorites(clientId: string): string[] {
  const raw = localStorage.getItem(favoritesKey(clientId));
  if (raw === null) return [...DEFAULT_FAVORITE_IDS];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

const DEMO_USERS: Record<string, { password: string; user: AuthUser }> = {
  'cliente@belago.app': {
    password: '123456',
    user: {
      id: 'demo-cliente',
      email: 'cliente@belago.app',
      name: 'Juliana Souza',
      role: 'cliente',
      phone: '',
      photoUrl: '',
    },
  },
  'profissional@belago.app': {
    password: '123456',
    user: {
      id: 'demo-profissional',
      email: 'profissional@belago.app',
      name: 'Fernanda Costa',
      role: 'profissional',
      phone: '',
      photoUrl: '',
    },
  },
  'admin@belago.app': {
    password: '123456',
    user: {
      id: 'demo-admin',
      email: 'admin@belago.app',
      name: 'Admin BelaGo',
      role: 'admin',
      phone: '',
      photoUrl: '',
    },
  },
};

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function findDemoUser(userId: string): AuthUser | null {
  return Object.values(DEMO_USERS).find((entry) => entry.user.id === userId)?.user ?? null;
}

function rawProById(id: string) {
  const pro = PROFESSIONALS.find((p) => p.id === id);
  if (!pro) throw new Error('Profissional não encontrada');
  return pro;
}

function proById(id: string) {
  // clona a referência para que consumidores em React (useState) percebam a mudança
  return { ...rawProById(id) };
}

export function createMockDataSource(): DataSource {
  availabilityStore.hydrate();
  professionalStore.hydrate();
  adminStore.hydrate();
  return {
    async signIn(email, password) {
      const entry = DEMO_USERS[email.trim().toLowerCase()];
      if (!entry || entry.password !== password) {
        throw new Error('E-mail ou senha incorretos');
      }
      await delay(null);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entry.user));
      return entry.user;
    },

    async signOut() {
      localStorage.removeItem(STORAGE_KEY);
    },

    async getSession() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as AuthUser;
      } catch {
        return null;
      }
    },

    async listProfessionals() {
      await delay(null, 150);
      return PROFESSIONALS;
    },

    async getProfessional(id) {
      await delay(null, 100);
      return PROFESSIONALS.find((p) => p.id === id) ?? null;
    },

    async listFavoriteIds(clientId) {
      return readFavorites(clientId);
    },

    async toggleFavorite(clientId, professionalId) {
      const current = readFavorites(clientId);
      const next = current.includes(professionalId)
        ? current.filter((id) => id !== professionalId)
        : [...current, professionalId];
      localStorage.setItem(favoritesKey(clientId), JSON.stringify(next));
      return next;
    },

    async getAvailableTimes(professionalId, date, serviceId) {
      const pro = PROFESSIONALS.find((p) => p.id === professionalId);
      const svc = pro?.services.find((s) => s.id === serviceId);
      if (!pro || !svc) return [];
      return availableTimes(pro, date, svc, appointmentsStore.busySlots(professionalId, date));
    },

    async getAvailableDays(professionalId, serviceId) {
      const pro = PROFESSIONALS.find((p) => p.id === professionalId);
      if (!pro) return [];
      const services = serviceId
        ? pro.services.filter((s) => s.id === serviceId && s.active)
        : activeServices(pro);
      return nextAvailableDays(pro, services, (date) => appointmentsStore.busySlots(professionalId, date));
    },

    async listAppointments(clientId) {
      return appointmentsStore.listForClient(clientId);
    },

    async createAppointment(clientId, input) {
      await delay(null, 250);
      const busy = appointmentsStore.busySlots(input.professionalId, input.scheduledDate);
      const pro = PROFESSIONALS.find((p) => p.id === input.professionalId);
      const svc = pro?.services.find((s) => s.id === input.serviceId);
      if (!pro || !svc) throw new Error('Serviço indisponível');
      const free = availableTimes(pro, input.scheduledDate, svc, busy);
      if (!free.includes(input.scheduledTime)) {
        throw new Error('Esse horário acabou de ser ocupado. Escolha outro.');
      }
      const client = findDemoUser(clientId);
      return appointmentsStore.create(clientId, input, client?.name ?? 'Cliente', client?.phone ?? '');
    },

    async cancelAppointment(clientId, appointmentId) {
      return appointmentsStore.cancel(clientId, appointmentId);
    },

    async rateAppointment(clientId, appointmentId, rating, text) {
      return appointmentsStore.rate(clientId, appointmentId, rating, text);
    },

    async updateProfile(userId, input) {
      await delay(null, 200);
      const raw = localStorage.getItem(STORAGE_KEY);
      const current = raw ? (JSON.parse(raw) as AuthUser) : null;
      if (!current || current.id !== userId) {
        throw new Error('Sessão inválida');
      }
      const updated: AuthUser = { ...current, ...input };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    },

    async requestAccountDeletion() {
      await delay(null, 200);
    },

    async getMyProfessional(userId) {
      const id = PROFESSIONAL_ID_BY_USER[userId];
      if (!id) throw new Error('Usuário não é uma profissional');
      return proById(id);
    },

    async listProAppointments(professionalId) {
      return appointmentsStore.listForProfessional(professionalId);
    },

    async setAvailabilitySlots(professionalId, date, slots) {
      await delay(null, 150);
      availabilityStore.setSlots(professionalId, date, slots);
      return proById(professionalId);
    },

    async removeAvailabilitySlot(professionalId, date, time) {
      await delay(null, 150);
      availabilityStore.removeSlot(professionalId, date, time);
      return proById(professionalId);
    },

    async updateMyProfessional(professionalId, input) {
      await delay(null, 200);
      rawProById(professionalId);
      professionalStore.update(professionalId, input);
      return proById(professionalId);
    },

    async updatePresentation(professionalId, input) {
      await delay(null, 200);
      rawProById(professionalId);
      professionalStore.update(professionalId, input);
      return proById(professionalId);
    },

    async saveService(professionalId, input, id) {
      await delay(null, 200);
      const pro = rawProById(professionalId);
      if (id) {
        const existing = pro.services.find((s) => s.id === id);
        if (!existing) throw new Error('Serviço não encontrado');
        Object.assign(existing, input);
      } else {
        pro.services.push({ id: `${pro.id}-s${Date.now()}`, ...input });
      }
      professionalStore.update(professionalId, { services: pro.services });
      return proById(professionalId);
    },

    async toggleServiceActive(professionalId, serviceId) {
      const pro = rawProById(professionalId);
      const svc = pro.services.find((s) => s.id === serviceId);
      if (!svc) throw new Error('Serviço não encontrado');
      svc.active = !svc.active;
      professionalStore.update(professionalId, { services: pro.services });
      return proById(professionalId);
    },

    async deleteService(professionalId, serviceId) {
      const pro = rawProById(professionalId);
      pro.services = pro.services.filter((s) => s.id !== serviceId);
      professionalStore.purgeServiceFromAvailability(professionalId, serviceId);
      availabilityStore.persistCurrent();
      professionalStore.update(professionalId, { services: pro.services });
      return proById(professionalId);
    },

    async addDocument(professionalId, doc) {
      const pro = rawProById(professionalId);
      if (pro.docs.length >= 10) throw new Error('Limite de 10 arquivos');
      pro.docs = [...pro.docs, { id: `d${Date.now()}`, ...doc }];
      professionalStore.update(professionalId, { docs: pro.docs });
      return proById(professionalId);
    },

    async removeDocument(professionalId, docId) {
      const pro = rawProById(professionalId);
      pro.docs = pro.docs.filter((d) => d.id !== docId);
      professionalStore.update(professionalId, { docs: pro.docs });
      return proById(professionalId);
    },

    async savePayout(professionalId, pix, bank) {
      await delay(null, 200);
      rawProById(professionalId);
      professionalStore.update(professionalId, { pix, bank });
      return proById(professionalId);
    },

    async listExpenses(professionalId) {
      return expensesStore.listForProfessional(professionalId);
    },

    async createExpense(professionalId, input) {
      await delay(null, 150);
      return expensesStore.create(professionalId, input);
    },

    async listAdminProfessionals() {
      return adminStore.listProfessionals();
    },

    async adminProfessionalAction(id, action) {
      await delay(null, 150);
      const nextStatus = (
        { aprovar: 'ativa', suspender: 'suspensa', reativar: 'ativa', excluir: 'excluida', advertir: null, solicitar: null } as const
      )[action];
      return adminStore.professionalAction(id, nextStatus);
    },

    async listAdminClients() {
      return adminStore.listClients();
    },

    async toggleAdminClientBlock(id) {
      return adminStore.toggleClientBlock(id);
    },

    async getAdminFinance(period) {
      await delay(null, 150);
      return ADMIN_FINANCE[period];
    },

    async listAdminPayouts() {
      return adminStore.listPayouts();
    },

    async processAdminPayout(id) {
      await delay(null, 200);
      return adminStore.processPayout(id);
    },

    async processAllAdminPayouts() {
      await delay(null, 300);
      return adminStore.processAllPayouts();
    },

    async listAdminDisputes() {
      return adminStore.listDisputes();
    },

    async resolveAdminDispute(id) {
      await delay(null, 200);
      return adminStore.resolveDispute(id);
    },

    async getAdminConfig() {
      return adminStore.getConfig();
    },

    async saveAdminConfig(rates) {
      await delay(null, 200);
      return adminStore.updateConfig(rates);
    },

    async toggleAdminConfigFlag(key) {
      return adminStore.toggleConfigFlag(key);
    },

    async toggleAdminMaintenance() {
      return adminStore.toggleMaintenance();
    },
  };
}
