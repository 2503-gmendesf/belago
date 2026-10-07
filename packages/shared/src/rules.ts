import { CFG } from './constants.js';

/**
 * Taxas vigentes da plataforma. Os valores padrão vêm de `CFG`; em produção a API lê as do
 * admin (tabela `platform_config`) e passa para as funções abaixo.
 */
export interface PlatformRates {
  /** Fração (0.15 = 15%). */
  commissionRate: number;
  homeFee: number;
  /** Fração (0.3 = 30%). */
  lateCancelPenaltyRate: number;
}

export const DEFAULT_RATES: PlatformRates = {
  commissionRate: CFG.commissionRate,
  homeFee: CFG.homeFee,
  lateCancelPenaltyRate: CFG.lateCancelPenaltyRate,
};

/**
 * Converte a linha de `platform_config` (percentuais em 0–100, taxa em R$) nas taxas usadas pelas
 * contas. Valor ausente ou inválido cai no padrão: uma linha mal preenchida não pode zerar a comissão.
 */
export function ratesFromConfig(
  row:
    | { commission_pct?: unknown; home_fee?: unknown; late_cancel_penalty_pct?: unknown }
    | null
    | undefined,
): PlatformRates {
  const valid = (value: unknown, max: number): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 && n <= max ? n : null;
  };
  const commission = valid(row?.commission_pct, 100);
  const penalty = valid(row?.late_cancel_penalty_pct, 100);
  return {
    commissionRate: commission === null ? DEFAULT_RATES.commissionRate : commission / 100,
    homeFee: valid(row?.home_fee, Number.POSITIVE_INFINITY) ?? DEFAULT_RATES.homeFee,
    lateCancelPenaltyRate: penalty === null ? DEFAULT_RATES.lateCancelPenaltyRate : penalty / 100,
  };
}

/** Preço do serviço + taxa de deslocamento (se houver). */
export function appointmentTotal(price: number, homeFee: number): number {
  return price + homeFee;
}

/** Valor líquido para a profissional após a comissão da plataforma. */
export function netAmount(total: number, commissionRate: number = CFG.commissionRate): number {
  return total * (1 - commissionRate);
}

/** Verdadeiro quando faltam menos de `CFG.lateCancelHours` para o horário marcado. */
export function isLateCancellation(startsAt: Date, now: Date = new Date()): boolean {
  return startsAt.getTime() - now.getTime() < CFG.lateCancelHours * 3600_000;
}

/** Multa de cancelamento tardio sobre o valor total do agendamento. */
export function lateCancelFee(total: number, penaltyRate: number = CFG.lateCancelPenaltyRate): number {
  return total * penaltyRate;
}

export type AppointmentPhase = 'confirmado' | 'realizado' | 'cancelado';

/**
 * A fase é derivada do horário (passou do término vira "realizado"); "cancelado" é status explícito.
 * Ver CLAUDE.md > Regras de negócio.
 */
export function appointmentPhase(params: { status: string; startsAt: Date; endsAt: Date; now?: Date }): AppointmentPhase {
  if (params.status === 'cancelado') return 'cancelado';
  const now = params.now ?? new Date();
  return params.endsAt < now ? 'realizado' : 'confirmado';
}

/**
 * Valores de um agendamento a partir do preço, da taxa de deslocamento já definida (snapshot do
 * agendamento) e da comissão vigente.
 */
export function settleFinancials(price: number, homeFee: number, commissionRate: number) {
  const total = appointmentTotal(price, homeFee);
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    homeFee,
    total: round(total),
    platformFee: round(total * commissionRate),
    net: round(netAmount(total, commissionRate)),
  };
}

/** Valores financeiros de um novo agendamento, calculados no servidor a partir do preço do serviço. */
export function appointmentFinancials(
  price: number,
  location: 'estudio' | 'domicilio',
  rates: PlatformRates = DEFAULT_RATES,
) {
  const homeFee = location === 'domicilio' ? rates.homeFee : 0;
  return settleFinancials(price, homeFee, rates.commissionRate);
}
