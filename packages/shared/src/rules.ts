import { CFG } from './constants.js';

/** Preço do serviço + taxa de deslocamento (se houver). */
export function appointmentTotal(price: number, homeFee: number): number {
  return price + homeFee;
}

/** Valor líquido para a profissional após a comissão da plataforma. */
export function netAmount(total: number): number {
  return total * (1 - CFG.commissionRate);
}

/** Verdadeiro quando faltam menos de `CFG.lateCancelHours` para o horário marcado. */
export function isLateCancellation(startsAt: Date, now: Date = new Date()): boolean {
  return startsAt.getTime() - now.getTime() < CFG.lateCancelHours * 3600_000;
}

/** Multa de cancelamento tardio sobre o valor total do agendamento. */
export function lateCancelFee(total: number): number {
  return total * CFG.lateCancelPenaltyRate;
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
