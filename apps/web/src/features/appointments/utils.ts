import { appointmentPhase, appointmentTotal, isLateCancellation, lateCancelFee } from '@belago/shared';
import { parseDateTime } from '../../lib/format.js';
import type { AppointmentPhase } from '@belago/shared';
import type { AppointmentView } from './types.js';

export function appointmentStart(a: AppointmentView): Date {
  return parseDateTime(a.scheduledDate, a.scheduledTime);
}

export function appointmentEnd(a: AppointmentView): Date {
  return new Date(appointmentStart(a).getTime() + a.durationMin * 60_000);
}

export function phaseOf(a: AppointmentView): AppointmentPhase {
  return appointmentPhase({ status: a.status, startsAt: appointmentStart(a), endsAt: appointmentEnd(a) });
}

export function totalOf(a: AppointmentView): number {
  return appointmentTotal(a.price, a.homeFee);
}

export function isLateToCancel(a: AppointmentView): boolean {
  return isLateCancellation(appointmentStart(a));
}

export function cancelFeeOf(a: AppointmentView): number {
  return lateCancelFee(totalOf(a));
}
