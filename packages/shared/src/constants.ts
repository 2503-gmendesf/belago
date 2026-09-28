export const ROLES = ['cliente', 'profissional', 'admin'] as const;

export const PROF_STATUS = ['pendente', 'ativa', 'suspensa', 'excluida'] as const;

export const APPT_STATUS = ['pendente', 'confirmado', 'cancelado', 'realizado', 'disputa'] as const;

export const APPT_LOCATION = ['estudio', 'domicilio'] as const;

export const PAYMENT_METHOD = ['pix', 'cartao', 'dinheiro'] as const;

export const PAYOUT_STATUS = ['pendente', 'processado'] as const;

export const SPECIALTIES = [
  'cabelo',
  'unhas',
  'sobrancelha',
  'cilios',
  'maquiagem',
  'depilacao',
  'penteado',
  'micropigmentacao',
] as const;

export const CFG = {
  commissionRate: 0.15,
  homeFee: 20,
  lateCancelHours: 2,
  lateCancelPenaltyRate: 0.3,
} as const;
