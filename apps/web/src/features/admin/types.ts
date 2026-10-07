export type AdminProfStatus = 'ativa' | 'pendente' | 'suspensa' | 'excluida';

export interface AdminProfessional {
  id: string;
  name: string;
  spec: string;
  city: string;
  status: AdminProfStatus;
  rating: number;
  appointmentsCount: number;
}

export interface AdminOverview {
  clients: number;
  clientsWeek: number;
  professionals: number;
  professionalsWeek: number;
  appointmentsToday: number;
  appointmentsYesterday: number;
  gmvMonth: number;
  gmvPrevMonth: number;
  /** [cidade, agendamentos no mês], do maior para o menor. */
  zones: Array<[string, number]>;
}

export type AdminProfAction = 'aprovar' | 'solicitar' | 'advertir' | 'suspender' | 'reativar' | 'excluir';

export type AdminClientStatus = 'ativa' | 'bloqueada';

export interface AdminClient {
  id: string;
  name: string;
  email: string;
  appointmentsCount: number;
  status: AdminClientStatus;
}

export interface AdminPayout {
  id: string;
  name: string;
  count: number;
  spec: string;
  value: number;
  done: boolean;
}

export interface AdminDispute {
  id: string;
  clientName: string;
  professionalName: string;
  value: number;
  reason: string;
  date: string;
}

export type DisputeResolution = 'reembolso' | 'manter';

export type AdminFinancePeriod = 'semana' | 'mes' | 'trim' | 'ano';

export interface AdminFinanceSnapshot {
  gmv: number;
  platform: number;
  paid: number;
  pending: number;
  avgFee: number;
  /** [receita da plataforma, repasse às profissionais] por período (semana/mês/etc.) */
  weekly: Array<[number, number]>;
}

export interface AdminConfigRates {
  commissionPct: number;
  depositMin: number;
  payoutDays: number;
  homeFee: number;
  lateFeePct: number;
}

export interface AdminConfigToggles {
  verify: boolean;
  identity: boolean;
  certs: boolean;
  reviews: boolean;
  portfolio: boolean;
}

export interface AdminConfig extends AdminConfigRates {
  maintenance: boolean;
  toggles: AdminConfigToggles;
}
