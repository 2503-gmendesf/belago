import { z } from 'zod';

export const APP_TIME_ZONE = 'America/Sao_Paulo';

export interface WallClock {
  date: string;
  time: string;
}

/** Data/hora corrente no fuso do negócio (BH), independente do fuso do servidor ou do aparelho. */
export function wallClockNow(now: Date = new Date(), timeZone: string = APP_TIME_ZONE): WallClock {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` };
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export interface AvailabilitySlotInput {
  time: string;
  all: boolean;
  serviceIds: string[];
}

/** Intervalo [início, fim) em minutos desde 00:00 já ocupado por outro agendamento. */
export type BusyInterval = [number, number];

/**
 * Horários livres de um serviço numa data: só slots que valem para o serviço, no futuro
 * e sem conflito de duração com os intervalos já ocupados (CLAUDE.md > Regras de negócio).
 */
export function freeTimesForDate(
  slots: AvailabilitySlotInput[],
  date: string,
  service: { id: string; durationMin: number },
  busy: BusyInterval[],
  now: WallClock = wallClockNow(),
): string[] {
  return slots
    .filter((slot) => slot.all || slot.serviceIds.includes(service.id))
    .map((slot) => slot.time)
    .filter((time) => {
      if (date < now.date || (date === now.date && time <= now.time)) return false;
      const start = toMinutes(time);
      const end = start + service.durationMin;
      return !busy.some(([busyStart, busyEnd]) => start < busyEnd && end > busyStart);
    })
    .sort();
}

/** Corpo de `POST /appointments`. `address` é texto livre, usado só no atendimento em domicílio. */
export const createAppointmentRequestSchema = z.object({
  professionalId: z.string().uuid(),
  serviceId: z.string().uuid(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduledTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  location: z.enum(['estudio', 'domicilio']),
  address: z.string().trim().max(200).optional(),
});
export type CreateAppointmentRequest = z.infer<typeof createAppointmentRequestSchema>;
