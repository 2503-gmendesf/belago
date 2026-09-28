import type { Specialty } from '@belago/shared';

export type AppointmentLocation = 'estudio' | 'domicilio';
/** Status persistido; "realizado" é derivado do horário, nunca armazenado (ver CLAUDE.md > Regras de negócio). */
export type AppointmentStoredStatus = 'confirmado' | 'cancelado';

export interface AppointmentReview {
  rating: number;
  text: string;
}

/** Snapshot do serviço no momento da contratação: alterar o serviço depois não muda o agendamento. */
export interface AppointmentView {
  id: string;
  professionalId: string;
  professionalName: string;
  serviceName: string;
  category: Specialty;
  durationMin: number;
  price: number;
  homeFee: number;
  scheduledDate: string;
  scheduledTime: string;
  location: AppointmentLocation;
  address: string;
  status: AppointmentStoredStatus;
  rated: boolean;
  review: AppointmentReview | null;
}

/** Visão de agendamento para a profissional: mesmos dados + identificação da cliente. */
export interface ProAppointmentView extends AppointmentView {
  clientName: string;
  clientPhone: string;
}

export interface CreateAppointmentInput {
  professionalId: string;
  serviceId: string;
  scheduledDate: string;
  scheduledTime: string;
  location: AppointmentLocation;
  address: string;
}
