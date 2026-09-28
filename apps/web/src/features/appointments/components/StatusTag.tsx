import type { AppointmentPhase } from '@belago/shared';

const LABELS: Record<AppointmentPhase, string> = {
  confirmado: 'Confirmado',
  realizado: 'Realizado',
  cancelado: 'Cancelado',
};

const CLASSES: Record<AppointmentPhase, string> = {
  confirmado: 'tag tag-ok',
  realizado: 'tag',
  cancelado: 'tag tag-bad',
};

export function StatusTag({ phase }: { phase: AppointmentPhase }) {
  return <span className={CLASSES[phase]}>{LABELS[phase]}</span>;
}
