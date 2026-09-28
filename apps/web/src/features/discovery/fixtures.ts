import type { Professional, ProAvailabilitySlot, ProService } from './types.js';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function dayOffset(n: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

function mkSvc(
  proIndex: number,
  n: number,
  name: string,
  category: ProService['category'],
  durationMin: number,
  price: number,
  active = true,
): ProService {
  return { id: `p${proIndex}-s${n}`, name, category, durationMin, price, active };
}

interface FixtureSeed {
  id: string;
  index: number;
  name: string;
  distanceKm: number;
  rating: number;
  reviewsCount: number;
  city: string;
  attendsHome: boolean;
  address: string;
  bio: string;
  socials: Professional['socials'];
  services: ProService[];
  reviews: Professional['reviews'];
}

const SEEDS: FixtureSeed[] = [
  {
    id: 'p0',
    index: 0,
    name: 'Fernanda Costa',
    distanceKm: 1.2,
    rating: 4.9,
    reviewsCount: 147,
    city: 'Betim, MG',
    attendsHome: true,
    address: 'Rua das Flores, 142 — Betim, MG',
    bio: 'Especialista em design de sobrancelha e extensão de cílios, com 8 anos de experiência. Meu objetivo é realçar a beleza natural de cada cliente.',
    socials: { instagram: '@fernandacosta.brows' },
    services: [
      mkSvc(0, 1, 'Design de Sobrancelha', 'sobrancelha', 45, 45),
      mkSvc(0, 2, 'Henna de Sobrancelha', 'sobrancelha', 60, 60),
      mkSvc(0, 3, 'Volume Russo', 'cilios', 120, 180),
      mkSvc(0, 4, 'Fio a Fio', 'cilios', 90, 150, false),
    ],
    reviews: [
      { name: 'Amanda R.', rating: 5, text: 'Perfeita! Minha sobrancelha nunca ficou tão bonita.', date: dayOffset(-9) },
      { name: 'Carla M.', rating: 5, text: 'Atendimento impecável e pontual.', date: dayOffset(-20) },
      { name: 'Luana T.', rating: 4, text: 'Ótimo trabalho, muito atenciosa.', date: dayOffset(-31) },
    ],
  },
  {
    id: 'p1',
    index: 1,
    name: 'Bruna Oliveira',
    distanceKm: 2.3,
    rating: 4.8,
    reviewsCount: 89,
    city: 'Contagem, MG',
    attendsHome: true,
    address: 'Av. João César de Oliveira, 500 — Contagem, MG',
    bio: 'Maquiadora profissional. Especializada em noivas, festas e eventos.',
    socials: { instagram: '@brunamakeoficial' },
    services: [
      mkSvc(1, 1, 'Maquiagem Social', 'maquiagem', 60, 120),
      mkSvc(1, 2, 'Maquiagem para Noiva', 'maquiagem', 120, 350),
      mkSvc(1, 3, 'Maquiagem Natural', 'maquiagem', 45, 90),
    ],
    reviews: [
      { name: 'Renata P.', rating: 5, text: 'Ficou lindo e durou a festa toda.', date: dayOffset(-14) },
      { name: 'Sofia L.', rating: 5, text: 'Super profissional.', date: dayOffset(-40) },
    ],
  },
  {
    id: 'p2',
    index: 2,
    name: 'Camila Santos',
    distanceKm: 0.8,
    rating: 5.0,
    reviewsCount: 213,
    city: 'Belo Horizonte, MG',
    attendsHome: false,
    address: 'Rua da Bahia, 1200 — Belo Horizonte, MG',
    bio: 'Cabeleireira com 10 anos de experiência em coloração, cortes e escova.',
    socials: { instagram: '@camilasantoshair', tiktok: '@camilahair' },
    services: [
      mkSvc(2, 1, 'Escova Simples', 'cabelo', 45, 60),
      mkSvc(2, 2, 'Escova Progressiva', 'cabelo', 150, 180),
      mkSvc(2, 3, 'Coloração', 'cabelo', 180, 220),
      mkSvc(2, 4, 'Corte Feminino', 'cabelo', 60, 80),
      mkSvc(2, 5, 'Penteado Social', 'penteado', 60, 120),
    ],
    reviews: [
      { name: 'Juliana S.', rating: 5, text: 'A melhor escova que já fiz.', date: dayOffset(-6) },
      { name: 'Patrícia N.', rating: 5, text: 'Cabelo lindo, atendimento ótimo.', date: dayOffset(-22) },
    ],
  },
  {
    id: 'p3',
    index: 3,
    name: 'Tainá Ferreira',
    distanceKm: 3.1,
    rating: 4.7,
    reviewsCount: 76,
    city: 'Belo Horizonte, MG',
    attendsHome: true,
    address: 'Rua Sergipe, 890 — Belo Horizonte, MG',
    bio: 'Nail designer especializada em nail art, gel e fibra de vidro.',
    socials: { instagram: '@tainanails' },
    services: [
      mkSvc(3, 1, 'Manicure Simples', 'unhas', 40, 35),
      mkSvc(3, 2, 'Pedicure Completa', 'unhas', 50, 45),
      mkSvc(3, 3, 'Unhas em Gel', 'unhas', 90, 120),
    ],
    reviews: [{ name: 'Juliana S.', rating: 5, text: 'Unhas perfeitas e duraram semanas.', date: dayOffset(-13) }],
  },
  {
    id: 'p4',
    index: 4,
    name: 'Letícia Moura',
    distanceKm: 4.0,
    rating: 4.9,
    reviewsCount: 54,
    city: 'Sabará, MG',
    attendsHome: false,
    address: 'Rua Comendador Viana, 77 — Sabará, MG',
    bio: 'Penteadeira especializada em casamentos e formaturas.',
    socials: { instagram: '@leticiamoura.hair' },
    services: [
      mkSvc(4, 1, 'Penteado Social', 'penteado', 60, 150),
      mkSvc(4, 2, 'Penteado para Noiva', 'penteado', 120, 400),
      mkSvc(4, 3, 'Coque Moderno', 'penteado', 40, 110),
    ],
    reviews: [{ name: 'Bianca F.', rating: 5, text: 'Meu penteado de formatura ficou perfeito.', date: dayOffset(-18) }],
  },
  {
    id: 'p5',
    index: 5,
    name: 'Priscila Ramos',
    distanceKm: 5.2,
    rating: 4.8,
    reviewsCount: 38,
    city: 'Contagem, MG',
    attendsHome: false,
    address: 'Rua Padre Pedro Pinto, 300 — Contagem, MG',
    bio: 'Micropigmentadora certificada. Sobrancelha, olhos e lábios.',
    socials: { instagram: '@priscilamicro' },
    services: [
      mkSvc(5, 1, 'Micropigmentação de Sobrancelha', 'micropigmentacao', 180, 500),
      mkSvc(5, 2, 'Micropigmentação Labial', 'micropigmentacao', 180, 600),
      mkSvc(5, 3, 'Retoque', 'micropigmentacao', 90, 200),
      mkSvc(5, 4, 'Depilação com Cera', 'depilacao', 40, 50),
    ],
    reviews: [{ name: 'Marina T.', rating: 5, text: 'Resultado natural, adorei.', date: dayOffset(-25) }],
  },
];

const AVAIL_TIMES = ['09:00', '10:30', '13:00', '14:00', '15:30', '17:00'];

function buildAvailability(index: number, services: ProService[]): Record<string, ProAvailabilitySlot[]> {
  const active = services.filter((s) => s.active);
  const availability: Record<string, ProAvailabilitySlot[]> = {};
  for (let i = 0; i < 21; i++) {
    if ((i + index) % 4 === 3) continue;
    const date = dayOffset(i);
    const slots: ProAvailabilitySlot[] = [];
    AVAIL_TIMES.forEach((time, k) => {
      if ((i + k + index) % 3 === 2) return;
      const partial = (k + index) % 4 === 1 && active.length > 1;
      slots.push(
        partial
          ? { time, all: false, serviceIds: active[0] ? [active[0].id] : [] }
          : { time, all: true, serviceIds: [] },
      );
    });
    if (slots.length) availability[date] = slots;
  }
  return availability;
}

export const PROFESSIONALS: Professional[] = SEEDS.map((seed) => ({
  id: seed.id,
  name: seed.name,
  photoUrl: '',
  distanceKm: seed.distanceKm,
  rating: seed.rating,
  reviewsCount: seed.reviewsCount,
  city: seed.city,
  status: 'ativa',
  attendsHome: seed.attendsHome,
  email: '',
  phone: '',
  address: seed.address,
  bio: seed.bio,
  socials: seed.socials,
  photos: [],
  services: seed.services,
  reviews: seed.reviews,
  availability: buildAvailability(seed.index, seed.services),
  pix: { type: 'cpf', key: '' },
  bank: { bank: '', agency: '', account: '', type: 'corrente' },
  docs: [],
}));

export const DEFAULT_FAVORITE_IDS = ['p0', 'p2'];
