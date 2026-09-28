import { PROFESSIONALS } from '../features/discovery/fixtures.js';
import type { Professional, ProBankInfo, ProDocument, ProPixInfo, ProService } from '../features/discovery/types.js';

const STORAGE_KEY = 'belago:mock-professional-profile';

interface MutableFields {
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  photoUrl: string;
  bio: string;
  socials: Professional['socials'];
  photos: string[];
  services: ProService[];
  pix: ProPixInfo;
  bank: ProBankInfo;
  docs: ProDocument[];
}

type ProfileMap = Record<string, MutableFields>;

function proById(id: string) {
  return PROFESSIONALS.find((p) => p.id === id);
}

function fieldsOf(p: Professional): MutableFields {
  return {
    name: p.name,
    email: p.email,
    phone: p.phone,
    city: p.city,
    address: p.address,
    photoUrl: p.photoUrl,
    bio: p.bio,
    socials: p.socials,
    photos: p.photos,
    services: p.services,
    pix: p.pix,
    bank: p.bank,
    docs: p.docs,
  };
}

function snapshot(): ProfileMap {
  const map: ProfileMap = {};
  PROFESSIONALS.forEach((p) => {
    map[p.id] = fieldsOf(p);
  });
  return map;
}

function persist(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot()));
}

let hydrated = false;

/** Aplica em memória os dados de perfil salvos no localStorage por cima das fixtures. Idempotente. */
export function hydrate(): void {
  if (hydrated) return;
  hydrated = true;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    persist();
    return;
  }
  try {
    const stored = JSON.parse(raw) as ProfileMap;
    PROFESSIONALS.forEach((p) => {
      const entry = stored[p.id];
      if (entry) Object.assign(p, entry);
    });
  } catch {
    // storage corrompido: mantém os valores das fixtures
  }
}

export function update(professionalId: string, patch: Partial<MutableFields>): void {
  const pro = proById(professionalId);
  if (!pro) return;
  Object.assign(pro, patch);
  persist();
}

/** Remove o serviço excluído de todos os horários de disponibilidade que o referenciam. */
export function purgeServiceFromAvailability(professionalId: string, serviceId: string): void {
  const pro = proById(professionalId);
  if (!pro) return;
  Object.keys(pro.availability).forEach((date) => {
    const slots = (pro.availability[date] ?? [])
      .map((slot) => (slot.all ? slot : { ...slot, serviceIds: slot.serviceIds.filter((id) => id !== serviceId) }))
      .filter((slot) => slot.all || slot.serviceIds.length > 0);
    if (slots.length) pro.availability[date] = slots;
    else delete pro.availability[date];
  });
}
