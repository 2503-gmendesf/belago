import type {
  AvailabilitySlotInput,
  BusyInterval,
  PAYMENT_METHOD,
  PlatformRates,
  Role,
  Specialty,
} from '@belago/shared';

export interface AuthUser {
  id: string;
  role: Role;
}

/** Valida o JWT do Supabase e devolve o usuário (ou null se inválido/expirado). */
export type Authenticator = (token: string) => Promise<AuthUser | null>;

export interface ServiceRecord {
  id: string;
  professionalId: string;
  name: string;
  category: Specialty;
  durationMin: number;
  price: number;
  active: boolean;
}

export interface NewAppointment {
  clientId: string;
  professionalId: string;
  serviceId: string;
  serviceName: string;
  category: Specialty;
  durationMin: number;
  price: number;
  homeFee: number;
  scheduledDate: string;
  scheduledTime: string;
  location: 'estudio' | 'domicilio';
  address: string | null;
}

export interface AppointmentRecord {
  id: string;
  clientId: string;
  professionalId: string;
  status: string;
  price: number;
  homeFee: number;
}

export type PaymentMethod = (typeof PAYMENT_METHOD)[number];

export interface NewPayment {
  appointmentId: string;
  amount: number;
  platformFee: number;
  netAmount: number;
  method: PaymentMethod;
  providerRef: string;
}

export interface PayoutRecord {
  id: string;
  professionalId: string;
  amount: number;
  status: 'pendente' | 'processado';
}

/** Porta de acesso a dados da API. A implementação real usa o Supabase com a service_role key. */
export interface Repo {
  getProfessionalStatus(id: string): Promise<string | null>;
  getService(id: string): Promise<ServiceRecord | null>;
  isMaintenanceMode(): Promise<boolean>;
  isClientBlocked(id: string): Promise<boolean>;
  /** Taxas configuradas pelo admin (platform_config); na falta, os padrões de `packages/shared`. */
  getRates(): Promise<PlatformRates>;
  listDaySlots(professionalId: string, date: string): Promise<AvailabilitySlotInput[]>;
  listBusyIntervals(professionalId: string, date: string): Promise<BusyInterval[]>;
  /** Lança `SlotTakenError` se o banco rejeitar por conflito de horário (corrida). */
  insertAppointment(input: NewAppointment): Promise<{ id: string }>;

  getAppointment(id: string): Promise<AppointmentRecord | null>;
  /** Grava o pagamento e confirma o agendamento; devolve false se `providerRef` já foi processado. */
  recordPayment(payment: NewPayment): Promise<boolean>;

  /** Exclusão LGPD: cancela agendamentos futuros, anonimiza dados pessoais e remove o acesso. */
  deleteAccount(userId: string): Promise<void>;

  /** Lança `NothingToPayoutError` se não há pagamentos a repassar no período. */
  createPayout(professionalId: string, periodStart: string, periodEnd: string): Promise<PayoutRecord>;
  /** Marca como processado; devolve null se não existe ou já não está pendente. */
  processPayout(id: string): Promise<PayoutRecord | null>;

  notify(profileId: string, title: string, body: string): Promise<void>;
}

export class SlotTakenError extends Error {}
export class NothingToPayoutError extends Error {}
