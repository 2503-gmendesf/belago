import { addDays, todayISO } from '../lib/format.js';
import type { CreateExpenseInput, Expense } from '../features/proFinance/types.js';

const STORAGE_KEY = 'belago:mock-expenses';

function seed(): Expense[] {
  const today = todayISO();
  return [
    { id: 'e1', professionalId: 'p0', desc: 'Material de sobrancelha', val: 85, cat: 'Material', date: addDays(today, -6) },
    { id: 'e2', professionalId: 'p0', desc: 'Uber até atendimento em domicílio', val: 32, cat: 'Transporte', date: addDays(today, -18) },
    { id: 'e3', professionalId: 'p0', desc: 'Impulsionamento Instagram', val: 60, cat: 'Marketing', date: addDays(today, -22) },
  ];
}

function readAll(): Expense[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    const seeded = seed();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw) as Expense[];
  } catch {
    return [];
  }
}

function writeAll(list: Expense[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function listForProfessional(professionalId: string): Expense[] {
  return readAll().filter((e) => e.professionalId === professionalId);
}

export function create(professionalId: string, input: CreateExpenseInput): Expense {
  const record: Expense = { id: `e${Date.now()}`, professionalId, ...input };
  const all = readAll();
  all.push(record);
  writeAll(all);
  return record;
}
