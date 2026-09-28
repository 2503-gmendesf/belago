import type { Specialty } from '@belago/shared';

export interface ProService {
  id: string;
  name: string;
  category: Specialty;
  durationMin: number;
  price: number;
  active: boolean;
}

export type ProServiceInput = Omit<ProService, 'id'>;

export interface ProReview {
  name: string;
  rating: number;
  text: string;
  date: string;
}

export interface ProPixInfo {
  type: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  key: string;
}

export interface ProBankInfo {
  bank: string;
  agency: string;
  account: string;
  type: 'corrente' | 'poupanca' | 'pagamento';
}

export interface ProDocument {
  id: string;
  name: string;
  size: number;
  type: string;
}

/** slot de disponibilidade: horário + serviços cobertos (all = todos os serviços ativos) */
export interface ProAvailabilitySlot {
  time: string;
  all: boolean;
  serviceIds: string[];
}

export interface Professional {
  id: string;
  name: string;
  photoUrl: string;
  distanceKm: number | null;
  rating: number;
  reviewsCount: number;
  city: string;
  status: 'ativa' | 'pendente' | 'suspensa' | 'excluida';
  attendsHome: boolean;
  email: string;
  phone: string;
  address: string;
  bio: string;
  socials: Partial<Record<'instagram' | 'youtube' | 'tiktok' | 'facebook', string>>;
  photos: string[];
  services: ProService[];
  reviews: ProReview[];
  /** disponibilidade por data (YYYY-MM-DD) */
  availability: Record<string, ProAvailabilitySlot[]>;
  pix: ProPixInfo;
  bank: ProBankInfo;
  docs: ProDocument[];
}

export interface SearchFilters {
  query: string;
  quick: 'near' | 'best' | 'today' | 'fav';
  categories: Specialty[];
  minRating: number;
  minPrice: string;
  maxPrice: string;
  maxDistanceKm: number;
}

export const DEFAULT_FILTERS: SearchFilters = {
  query: '',
  quick: 'near',
  categories: [],
  minRating: 0,
  minPrice: '',
  maxPrice: '',
  maxDistanceKm: 0,
};
