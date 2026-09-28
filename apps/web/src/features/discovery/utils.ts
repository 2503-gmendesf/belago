import type { Specialty } from '@belago/shared';
import type { Professional, ProService, SearchFilters } from './types.js';

export interface CategoryMeta {
  id: Specialty;
  name: string;
  icon: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'cabelo', name: 'Cabelo', icon: 'scissors' },
  { id: 'unhas', name: 'Unhas', icon: 'hand' },
  { id: 'sobrancelha', name: 'Sobrancelha', icon: 'eye' },
  { id: 'cilios', name: 'Cílios', icon: 'lash' },
  { id: 'maquiagem', name: 'Maquiagem', icon: 'palette' },
  { id: 'depilacao', name: 'Depilação', icon: 'leaf' },
  { id: 'penteado', name: 'Penteado', icon: 'crown' },
  { id: 'micropigmentacao', name: 'Micropigmentação', icon: 'pen' },
];

export function categoryName(id: Specialty): string {
  return CATEGORIES.find((c) => c.id === id)?.name ?? 'Outros';
}

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function activeServices(p: Professional): ProService[] {
  return p.services.filter((s) => s.active);
}

export function distanceOf(p: Professional): number {
  return p.distanceKm ?? 999;
}

export function formatDistance(p: Professional): string {
  if (p.distanceKm == null) return '';
  return p.distanceKm.toFixed(1).replace('.', ',') + ' km';
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Horários livres para o serviço na data, excluindo os já ocupados por outros agendamentos (`busy`). */
export function availableTimes(
  p: Professional,
  date: string,
  service: ProService | undefined,
  busy: Array<[number, number]> = [],
): string[] {
  if (!service || !service.active) return [];
  const now = new Date();
  const slots = p.availability[date] ?? [];
  return slots
    .filter((slot) => slot.all || slot.serviceIds.includes(service.id))
    .map((slot) => slot.time)
    .filter((time) => {
      const [y, m, d] = date.split('-').map(Number);
      const [h, min] = time.split(':').map(Number);
      const when = new Date(y ?? 0, (m ?? 1) - 1, d ?? 1, h ?? 0, min ?? 0);
      if (when <= now) return false;
      const start = toMinutes(time);
      const end = start + service.durationMin;
      return !busy.some(([busyStart, busyEnd]) => start < busyEnd && end > busyStart);
    })
    .sort();
}

export function hasAvailabilityToday(p: Professional): boolean {
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate(),
  ).padStart(2, '0')}`;
  return activeServices(p).some((s) => availableTimes(p, iso, s).length > 0);
}

/** `getBusy` deixa a chamada informar as ocupações reais (agendamentos já feitos) por data. */
export function nextAvailableDays(
  p: Professional,
  services: ProService[],
  getBusy: (date: string) => Array<[number, number]>,
  maxDays = 14,
  limit = 6,
): Array<[string, number]> {
  const result: Array<[string, number]> = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < maxDays && result.length < limit; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const busy = getBusy(iso);
    const times = new Set<string>();
    services.forEach((s) => availableTimes(p, iso, s, busy).forEach((t) => times.add(t)));
    if (times.size) result.push([iso, times.size]);
  }
  return result;
}

export function searchProfessionals(
  all: Professional[],
  filters: SearchFilters,
  favoriteIds: Set<string>,
): Professional[] {
  const q = normalize(filters.query.trim());
  let list = all.filter((p) => p.status === 'ativa');

  if (q) {
    list = list.filter(
      (p) =>
        normalize(p.name).includes(q) ||
        activeServices(p).some((s) => normalize(s.name).includes(q) || normalize(categoryName(s.category)).includes(q)),
    );
  }
  if (filters.categories.length) {
    list = list.filter((p) => activeServices(p).some((s) => filters.categories.includes(s.category)));
  }
  if (filters.minRating) {
    list = list.filter((p) => p.rating >= filters.minRating);
  }
  const min = filters.minPrice === '' ? null : Number(filters.minPrice);
  const max = filters.maxPrice === '' ? null : Number(filters.maxPrice);
  if (min !== null || max !== null) {
    list = list.filter((p) =>
      activeServices(p).some((s) => (min === null || s.price >= min) && (max === null || s.price <= max)),
    );
  }
  if (filters.maxDistanceKm) {
    list = list.filter((p) => distanceOf(p) <= filters.maxDistanceKm);
  }
  if (filters.quick === 'today') {
    list = list.filter(hasAvailabilityToday);
  }
  if (filters.quick === 'fav') {
    list = list.filter((p) => favoriteIds.has(p.id));
  }

  list = [...list].sort(
    filters.quick === 'best' ? (a, b) => b.rating - a.rating : (a, b) => distanceOf(a) - distanceOf(b),
  );
  return list;
}

export function pluralize(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}
