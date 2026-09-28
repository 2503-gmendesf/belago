import type {
  AdminClient,
  AdminConfig,
  AdminDispute,
  AdminFinancePeriod,
  AdminFinanceSnapshot,
  AdminPayout,
  AdminProfessional,
} from './types.js';

export const ADMIN_PROFESSIONALS: AdminProfessional[] = [
  { id: 'ap1', name: 'Fernanda Costa', spec: 'Sobrancelha', city: 'Betim', status: 'ativa', rating: 4.9, appointmentsCount: 142 },
  { id: 'ap2', name: 'Ana Paula Silva', spec: 'Cabelo', city: 'BH', status: 'ativa', rating: 4.8, appointmentsCount: 210 },
  { id: 'ap3', name: 'Juliana Soares', spec: 'Maquiagem', city: 'Contagem', status: 'pendente', rating: 0, appointmentsCount: 0 },
  { id: 'ap4', name: 'Mariana Lima', spec: 'Cílios', city: 'BH', status: 'ativa', rating: 4.7, appointmentsCount: 89 },
  { id: 'ap5', name: 'Camila Rocha', spec: 'Unhas', city: 'Betim', status: 'suspensa', rating: 3.2, appointmentsCount: 44 },
  { id: 'ap6', name: 'Sandra Melo', spec: 'Depilação', city: 'Sabará', status: 'ativa', rating: 4.6, appointmentsCount: 76 },
  { id: 'ap7', name: 'Kézia Lima', spec: 'Depilação', city: 'Betim', status: 'pendente', rating: 0, appointmentsCount: 0 },
  { id: 'ap8', name: 'Maria Rodrigues', spec: 'Unhas', city: 'BH', status: 'pendente', rating: 0, appointmentsCount: 0 },
  { id: 'ap9', name: 'Bruna Oliveira', spec: 'Maquiagem', city: 'Contagem', status: 'ativa', rating: 4.8, appointmentsCount: 89 },
  { id: 'ap10', name: 'Patrícia Nunes', spec: 'Cabelo', city: 'BH', status: 'suspensa', rating: 2.8, appointmentsCount: 30 },
];

export const ADMIN_CLIENTS: AdminClient[] = [
  { id: 'ac1', name: 'Juliana Souza', email: 'juliana@email.com', appointmentsCount: 12, status: 'ativa' },
  { id: 'ac2', name: 'Rafaela Santos', email: 'rafaela@email.com', appointmentsCount: 5, status: 'ativa' },
  { id: 'ac3', name: 'Carla Teixeira', email: 'carla@email.com', appointmentsCount: 8, status: 'bloqueada' },
  { id: 'ac4', name: 'Letícia Moura', email: 'leticia@email.com', appointmentsCount: 22, status: 'ativa' },
  { id: 'ac5', name: 'Amanda Ferreira', email: 'amanda@email.com', appointmentsCount: 3, status: 'ativa' },
  { id: 'ac6', name: 'Beatriz Alves', email: 'beatriz@email.com', appointmentsCount: 17, status: 'ativa' },
  { id: 'ac7', name: 'Gabriela Costa', email: 'gabi@email.com', appointmentsCount: 9, status: 'ativa' },
  { id: 'ac8', name: 'Tatiane Lima', email: 'tatiane@email.com', appointmentsCount: 0, status: 'bloqueada' },
];

export const ADMIN_PAYOUTS: AdminPayout[] = [
  { id: 'pay1', name: 'Fernanda Costa', count: 4, spec: 'Sobrancelha', value: 382, done: false },
  { id: 'pay2', name: 'Ana Paula Silva', count: 7, spec: 'Cabelo', value: 630, done: false },
  { id: 'pay3', name: 'Mariana Lima', count: 3, spec: 'Cílios', value: 450, done: false },
  { id: 'pay4', name: 'Camila Rocha', count: 5, spec: 'Unhas', value: 690, done: false },
];

export const ADMIN_DISPUTES: AdminDispute[] = [
  { id: 1, clientName: 'Rafaela S.', professionalName: 'Fernanda C.', value: 180, reason: 'Profissional não compareceu', date: '23/08' },
  { id: 2, clientName: 'Juliana M.', professionalName: 'Ana P.', value: 60, reason: 'Qualidade do serviço', date: '22/08' },
  { id: 3, clientName: 'Carla T.', professionalName: 'Mariana L.', value: 150, reason: 'Cancelamento tardio', date: '20/08' },
];

export const ADMIN_FINANCE: Record<AdminFinancePeriod, AdminFinanceSnapshot> = {
  semana: { gmv: 11_240, platform: 1686, paid: 9020, pending: 534, avgFee: 8.4, weekly: [[1686, 9020]] },
  mes: {
    gmv: 48_320,
    platform: 7248,
    paid: 38_920,
    pending: 2152,
    avgFee: 8.5,
    weekly: [
      [1480, 8240],
      [1720, 9800],
      [2110, 11_900],
      [1938, 9000],
    ],
  },
  trim: {
    gmv: 141_900,
    platform: 21_285,
    paid: 118_210,
    pending: 2405,
    avgFee: 8.6,
    weekly: [
      [6800, 38_000],
      [7400, 41_000],
      [7085, 39_210],
    ],
  },
  ano: {
    gmv: 512_400,
    platform: 76_860,
    paid: 433_100,
    pending: 2440,
    avgFee: 8.7,
    weekly: [
      [9000, 50_000],
      [11_000, 60_000],
      [14_000, 76_000],
      [18_000, 98_000],
      [24_860, 149_100],
    ],
  },
};

export const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  commissionPct: 15,
  depositMin: 15,
  payoutDays: 7,
  homeFee: 20,
  lateFeePct: 30,
  maintenance: false,
  toggles: { verify: true, identity: true, certs: false, reviews: true, portfolio: false },
};
