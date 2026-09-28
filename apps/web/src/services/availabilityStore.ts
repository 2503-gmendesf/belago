import { PROFESSIONALS } from '../features/discovery/fixtures.js';
import type { ProAvailabilitySlot } from '../features/discovery/types.js';

const STORAGE_KEY = 'belago:mock-availability';

type AvailabilityMap = Record<string, Record<string, ProAvailabilitySlot[]>>;

function proById(id: string) {
  return PROFESSIONALS.find((p) => p.id === id);
}

function snapshot(): AvailabilityMap {
  const map: AvailabilityMap = {};
  PROFESSIONALS.forEach((p) => {
    map[p.id] = p.availability;
  });
  return map;
}

function persist(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot()));
}

/** Persiste o estado atual de disponibilidade; usar após mutações feitas fora deste módulo (ex.: exclusão de serviço). */
export function persistCurrent(): void {
  persist();
}

let hydrated = false;

/** Aplica em memória a disponibilidade salva no localStorage por cima das fixtures. Idempotente. */
export function hydrate(): void {
  if (hydrated) return;
  hydrated = true;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    persist();
    return;
  }
  try {
    const stored = JSON.parse(raw) as AvailabilityMap;
    PROFESSIONALS.forEach((p) => {
      const entry = stored[p.id];
      if (entry) p.availability = entry;
    });
  } catch {
    // storage corrompido: mantém os valores das fixtures
  }
}

export function setSlots(professionalId: string, date: string, slots: ProAvailabilitySlot[]): void {
  const pro = proById(professionalId);
  if (!pro) return;
  if (slots.length) pro.availability[date] = slots;
  else delete pro.availability[date];
  persist();
}

export function removeSlot(professionalId: string, date: string, time: string): void {
  const pro = proById(professionalId);
  if (!pro) return;
  const remaining = (pro.availability[date] ?? []).filter((s) => s.time !== time);
  if (remaining.length) pro.availability[date] = remaining;
  else delete pro.availability[date];
  persist();
}
