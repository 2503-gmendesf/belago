import {
  ADMIN_CLIENTS,
  ADMIN_DISPUTES,
  ADMIN_PAYOUTS,
  ADMIN_PROFESSIONALS,
  DEFAULT_ADMIN_CONFIG,
} from '../features/admin/fixtures.js';
import type { AdminClient, AdminConfig, AdminDispute, AdminPayout, AdminProfessional } from '../features/admin/types.js';

const STORAGE_KEY = 'belago:mock-admin';

interface AdminState {
  professionals: AdminProfessional[];
  clients: AdminClient[];
  payouts: AdminPayout[];
  disputes: AdminDispute[];
  config: AdminConfig;
}

let state: AdminState = {
  professionals: ADMIN_PROFESSIONALS.map((p) => ({ ...p })),
  clients: ADMIN_CLIENTS.map((c) => ({ ...c })),
  payouts: ADMIN_PAYOUTS.map((p) => ({ ...p })),
  disputes: ADMIN_DISPUTES.map((d) => ({ ...d })),
  config: { ...DEFAULT_ADMIN_CONFIG, toggles: { ...DEFAULT_ADMIN_CONFIG.toggles } },
};

let hydrated = false;

function persist(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** Clona para que consumidores (ex.: React `useState`) nunca guardem uma referência mutável em memória. */
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Aplica em memória o estado salvo no localStorage por cima das fixtures. Idempotente. */
export function hydrate(): void {
  if (hydrated) return;
  hydrated = true;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    persist();
    return;
  }
  try {
    state = JSON.parse(raw) as AdminState;
  } catch {
    // storage corrompido: mantém os valores das fixtures
  }
}

export function listProfessionals(): AdminProfessional[] {
  return clone(state.professionals);
}

export function professionalAction(id: string, nextStatus: AdminProfessional['status'] | null): AdminProfessional[] {
  const pro = state.professionals.find((p) => p.id === id);
  if (pro && nextStatus) pro.status = nextStatus;
  persist();
  return clone(state.professionals);
}

export function listClients(): AdminClient[] {
  return clone(state.clients);
}

export function toggleClientBlock(id: string): AdminClient[] {
  const client = state.clients.find((c) => c.id === id);
  if (client) client.status = client.status === 'bloqueada' ? 'ativa' : 'bloqueada';
  persist();
  return clone(state.clients);
}

export function listPayouts(): AdminPayout[] {
  return clone(state.payouts);
}

export function processPayout(id: string): AdminPayout[] {
  const payout = state.payouts.find((p) => p.id === id);
  if (payout) payout.done = true;
  persist();
  return clone(state.payouts);
}

export function processAllPayouts(): AdminPayout[] {
  state.payouts.forEach((p) => {
    p.done = true;
  });
  persist();
  return clone(state.payouts);
}

export function listDisputes(): AdminDispute[] {
  return clone(state.disputes);
}

export function resolveDispute(id: string): AdminDispute[] {
  // String(): o localStorage de versões antigas guardou ids numéricos.
  state.disputes = state.disputes.filter((d) => String(d.id) !== id);
  persist();
  return clone(state.disputes);
}

export function getConfig(): AdminConfig {
  return clone(state.config);
}

export function updateConfig(patch: Partial<AdminConfig>): AdminConfig {
  state.config = { ...state.config, ...patch };
  persist();
  return clone(state.config);
}

export function toggleConfigFlag(key: keyof AdminConfig['toggles']): AdminConfig {
  state.config.toggles[key] = !state.config.toggles[key];
  persist();
  return clone(state.config);
}

export function toggleMaintenance(): AdminConfig {
  state.config.maintenance = !state.config.maintenance;
  persist();
  return clone(state.config);
}
