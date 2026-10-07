import { addDays, parseISODate, todayISO } from '../../lib/format.js';
import { appointmentStart, phaseOf, totalOf } from '../appointments/utils.js';
import type { ProAppointmentView } from '../appointments/types.js';
import type { Expense } from './types.js';

export type FinRangeKey = '90' | '30' | '25' | 'custom';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function startOfDay(iso: string): Date {
  return parseISODate(iso);
}

function endOfDay(iso: string): Date {
  const d = parseISODate(iso);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function resolveRange(range: FinRangeKey, from: string, to: string): [Date, Date] | null {
  if (range === 'custom') {
    if (!from || !to) return null;
    return from <= to ? [startOfDay(from), endOfDay(to)] : [startOfDay(to), endOfDay(from)];
  }
  const n = Number(range);
  return [startOfDay(addDays(todayISO(), -(n - 1))), endOfDay(todayISO())];
}

export interface FinCalc {
  revenue: ProAppointmentView[];
  expenses: Expense[];
  gross: number;
  commission: number;
  expensesTotal: number;
  net: number;
}

export function calcFinance(
  appointments: ProAppointmentView[],
  expenses: Expense[],
  [from, to]: [Date, Date],
  commissionRate: number,
): FinCalc {
  const revenue = appointments.filter(
    (a) => phaseOf(a) === 'realizado' && appointmentStart(a) >= from && appointmentStart(a) <= to,
  );
  const exp = expenses.filter((e) => {
    const d = parseISODate(e.date);
    return d >= from && d <= to;
  });
  const gross = revenue.reduce((s, a) => s + totalOf(a), 0);
  const commission = gross * commissionRate;
  const expensesTotal = exp.reduce((s, e) => s + e.val, 0);
  return { revenue, expenses: exp, gross, commission, expensesTotal, net: gross - commission - expensesTotal };
}

export interface FinBin {
  label: string;
  rev: number;
  exp: number;
}

export function buildBins(calc: FinCalc, [from, to]: [Date, Date]): { bins: FinBin[]; stepDays: number } {
  const span = Math.round((to.getTime() - from.getTime()) / 86_400_000);
  const step = span <= 14 ? 1 : 7;
  const bins: FinBin[] = [];
  const stepMs = step * 86_400_000;
  for (let d = new Date(from); d <= to; d = new Date(d.getTime() + stepMs)) {
    const next = new Date(d.getTime() + stepMs);
    const rev = calc.revenue
      .filter((a) => appointmentStart(a) >= d && appointmentStart(a) < next)
      .reduce((s, a) => s + totalOf(a), 0);
    const exp = calc.expenses
      .filter((e) => {
        const ed = parseISODate(e.date);
        return ed >= d && ed < next;
      })
      .reduce((s, e) => s + e.val, 0);
    bins.push({ label: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`, rev, exp });
  }
  return { bins, stepDays: step };
}
