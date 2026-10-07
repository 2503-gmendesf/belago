const DOW = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MON = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MON_FULL = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

export function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function isoFromDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(): string {
  return isoFromDate(new Date());
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1);
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return isoFromDate(d);
}

export function parseDateTime(dateISO: string, time: string): Date {
  const [h, min] = time.split(':').map(Number);
  const d = parseISODate(dateISO);
  d.setHours(h ?? 0, min ?? 0, 0, 0);
  return d;
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function fromMinutes(total: number): string {
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

export function fmtDay(iso: string): string {
  const d = parseISODate(iso);
  return `${DOW[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]}`;
}

export function fmtDayLong(iso: string): string {
  const d = parseISODate(iso);
  const dow = DOW[d.getDay()] ?? '';
  return `${dow.charAt(0).toUpperCase()}${dow.slice(1)}, ${d.getDate()} de ${MON_FULL[d.getMonth()]}`;
}

export function fmtDayShort(iso: string): { dow: string; day: number; mon: string } {
  const d = parseISODate(iso);
  return { dow: DOW[d.getDay()] ?? '', day: d.getDate(), mon: MON[d.getMonth()] ?? '' };
}

export function brl(n: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);
}

/** Fração em percentual para texto (0.15 -> "15", 0.125 -> "12,5"), sem ruído de ponto flutuante. */
export function pctLabel(rate: number): string {
  return String(Math.round(rate * 10_000) / 100).replace('.', ',');
}

export function plural(n: number, singular: string, pluralForm: string): string {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

export { DOW, MON };

export function ago(iso: string): string {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return `há ${m} min`;
  if (m < 1440) return `há ${Math.round(m / 60)} h`;
  return `há ${Math.round(m / 1440)} d`;
}
