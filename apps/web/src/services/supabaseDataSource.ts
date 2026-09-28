import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Role } from '@belago/shared';
import { env } from '../env.js';
import type { AppointmentLocation, AppointmentView } from '../features/appointments/types.js';
import { isoFromDate, toMinutes } from '../lib/format.js';
import type {
  ProAvailabilitySlot,
  ProBankInfo,
  ProPixInfo,
  Professional,
  ProService,
} from '../features/discovery/types.js';
import type { CreateExpenseInput, Expense } from '../features/proFinance/types.js';
import type { AuthUser, DataSource } from './types.js';

const NOT_IMPLEMENTED =
  'Ainda não migrado para o Supabase (painel do admin chega na Fase 5, junto com a API).';

function admin404(): never {
  throw new Error(NOT_IMPLEMENTED);
}

interface ProfileRow {
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
}

interface ServiceRow {
  id: string;
  name: string;
  category: string;
  duration_min: number;
  price: number | string;
  active: boolean;
}

interface SlotServiceRow {
  service_id: string;
}

interface SlotRow {
  date: string;
  time: string;
  all_services: boolean;
  availability_slot_services: SlotServiceRow[];
}

interface ReviewRow {
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: { name: string } | null;
}

interface ProfessionalProfileRow {
  profile_id: string;
  specialty: string;
  bio: string | null;
  status: string;
  rating: number | string;
  reviews_count: number;
  city: string | null;
  address: string | null;
  attends_home: boolean;
  photos: string[] | null;
  socials: Professional['socials'] | null;
  pix_key: string | null;
  pix_type: string | null;
  bank_info: ProBankInfo | null;
  profiles: ProfileRow;
  professional_services: ServiceRow[];
}

const PROFESSIONAL_SELECT = `
  profile_id, specialty, bio, status, rating, reviews_count, city, address, attends_home,
  photos, socials, pix_key, pix_type, bank_info,
  profiles:profile_id ( name, email, phone, avatar_url ),
  professional_services ( id, name, category, duration_min, price, active )
`;

function toProService(row: ServiceRow): ProService {
  return {
    id: row.id,
    name: row.name,
    category: row.category as ProService['category'],
    durationMin: row.duration_min,
    price: Number(row.price),
    active: row.active,
  };
}

function toProAvailabilitySlot(row: SlotRow): ProAvailabilitySlot {
  return {
    time: row.time.slice(0, 5),
    all: row.all_services,
    serviceIds: row.availability_slot_services.map((s) => s.service_id),
  };
}

function groupAvailability(rows: SlotRow[]): Record<string, ProAvailabilitySlot[]> {
  const map: Record<string, ProAvailabilitySlot[]> = {};
  for (const row of rows) {
    (map[row.date] ??= []).push(toProAvailabilitySlot(row));
  }
  return map;
}

function toReview(row: ReviewRow): Professional['reviews'][number] {
  return {
    name: row.profiles?.name ?? 'Cliente',
    rating: row.rating,
    text: row.comment ?? '',
    date: row.created_at.slice(0, 10),
  };
}

/** Horários livres, dado o serviço, os slots abertos na data e os intervalos [inicio,fim) já ocupados. */
function freeTimesForDate(
  slots: ProAvailabilitySlot[],
  date: string,
  service: ProService,
  busy: Array<[number, number]>,
): string[] {
  const now = new Date();
  return slots
    .filter((slot) => slot.all || slot.serviceIds.includes(service.id))
    .map((slot) => slot.time)
    .filter((time) => {
      const [y, m, d] = date.split('-').map(Number);
      const [h, min] = time.split(':').map(Number);
      const when = new Date(y ?? 0, (m ?? 1) - 1, d ?? 1, h ?? 0, min ?? 0);
      if (when <= now) return false;
      const start = toMinutes(time);
      const end = start + service.durationMin;
      return !busy.some(([busyStart, busyEnd]) => start < busyEnd && end > busyStart);
    })
    .sort();
}

export function createSupabaseDataSource(): DataSource {
  const client: SupabaseClient = createClient(env.supabaseUrl, env.supabaseAnonKey);

  async function toAuthUser(userId: string, fallbackEmail: string): Promise<AuthUser> {
    const { data: profile, error } = await client
      .from('profiles')
      .select('name, role, phone, avatar_url')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      throw new Error('Não foi possível carregar o perfil do usuário');
    }

    return {
      id: userId,
      email: fallbackEmail,
      name: profile.name as string,
      role: profile.role as Role,
      phone: (profile.phone as string | null) ?? '',
      photoUrl: (profile.avatar_url as string | null) ?? '',
    };
  }

  function toProfessional(
    row: ProfessionalProfileRow,
    availability: Record<string, ProAvailabilitySlot[]>,
    reviews: Professional['reviews'],
  ): Professional {
    return {
      id: row.profile_id,
      name: row.profiles.name,
      photoUrl: row.profiles.avatar_url ?? '',
      distanceKm: null,
      rating: Number(row.rating),
      reviewsCount: row.reviews_count,
      city: row.city ?? '',
      status: row.status as Professional['status'],
      attendsHome: row.attends_home,
      email: row.profiles.email,
      phone: row.profiles.phone ?? '',
      address: row.address ?? '',
      bio: row.bio ?? '',
      socials: row.socials ?? {},
      photos: row.photos ?? [],
      services: row.professional_services.map(toProService),
      reviews,
      availability,
      pix: { type: (row.pix_type as ProPixInfo['type']) ?? 'cpf', key: row.pix_key ?? '' },
      bank: row.bank_info ?? { bank: '', agency: '', account: '', type: 'corrente' },
      docs: [],
    };
  }

  /** Carrega disponibilidade (próximos 14 dias) e avaliações para um conjunto de profissionais. */
  async function hydrateProfessionals(rows: ProfessionalProfileRow[]): Promise<Professional[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.profile_id);
    const today = new Date();
    const todayISO = isoFromDate(today);
    const until = new Date(today);
    until.setDate(until.getDate() + 13);
    const untilISO = isoFromDate(until);

    const [{ data: slots }, { data: reviewRows }, { data: docs }] = await Promise.all([
      client
        .from('availability_slots')
        .select(
          'professional_id, date, time, all_services, availability_slot_services ( service_id )',
        )
        .in('professional_id', ids)
        .gte('date', todayISO)
        .lte('date', untilISO),
      client
        .from('reviews')
        .select('professional_id, rating, comment, created_at, profiles:client_id ( name )')
        .in('professional_id', ids)
        .order('created_at', { ascending: false }),
      client
        .from('professional_documents')
        .select('id, professional_id, name, size, type')
        .in('professional_id', ids),
    ]);

    const slotsByPro = new Map<string, SlotRow[]>();
    for (const s of (slots ?? []) as Array<SlotRow & { professional_id: string }>) {
      const list = slotsByPro.get(s.professional_id) ?? [];
      list.push(s);
      slotsByPro.set(s.professional_id, list);
    }
    const reviewsByPro = new Map<string, ReviewRow[]>();
    for (const r of (reviewRows ?? []) as unknown as Array<
      ReviewRow & { professional_id: string }
    >) {
      const list = reviewsByPro.get(r.professional_id) ?? [];
      list.push(r);
      reviewsByPro.set(r.professional_id, list);
    }
    const docsByPro = new Map<
      string,
      Array<{ id: string; name: string; size: number; type: string }>
    >();
    for (const d of (docs ?? []) as Array<{
      id: string;
      name: string;
      size: number;
      type: string;
      professional_id: string;
    }>) {
      const list = docsByPro.get(d.professional_id) ?? [];
      list.push({ id: d.id, name: d.name, size: d.size, type: d.type });
      docsByPro.set(d.professional_id, list);
    }

    return rows.map((row) => {
      const pro = toProfessional(
        row,
        groupAvailability(slotsByPro.get(row.profile_id) ?? []),
        (reviewsByPro.get(row.profile_id) ?? []).map(toReview),
      );
      pro.docs = docsByPro.get(row.profile_id) ?? [];
      return pro;
    });
  }

  async function fetchProfessional(id: string): Promise<Professional | null> {
    const { data, error } = await client
      .from('professional_profiles')
      .select(PROFESSIONAL_SELECT)
      .eq('profile_id', id)
      .maybeSingle();
    if (error || !data) return null;
    const [pro] = await hydrateProfessionals([data as unknown as ProfessionalProfileRow]);
    return pro ?? null;
  }

  function toAppointmentView(row: AppointmentRow): AppointmentView {
    // PostgREST devolve o embed reverso de `reviews` como array ou como objeto único
    // dependendo da versão (a FK appointment_id é unique, então a relação é 1:1) —
    // normaliza os dois formatos antes de ler.
    const rawReviews = row.reviews as unknown;
    const reviews = Array.isArray(rawReviews) ? rawReviews : rawReviews ? [rawReviews] : [];
    return {
      id: row.id,
      professionalId: row.professional_id,
      professionalName: row.professional?.profiles?.name ?? '',
      serviceName: row.service_name,
      category: row.category as AppointmentView['category'],
      durationMin: row.duration_min,
      price: Number(row.price),
      homeFee: Number(row.home_fee),
      scheduledDate: row.scheduled_date,
      scheduledTime: row.scheduled_time.slice(0, 5),
      location: row.location as AppointmentLocation,
      address: '',
      status: row.status === 'cancelado' ? 'cancelado' : 'confirmado',
      rated: reviews.length > 0,
      review: reviews[0] ? { rating: reviews[0].rating, text: reviews[0].comment ?? '' } : null,
    };
  }

  async function assertOwnProfessional(userId: string): Promise<void> {
    const { data } = await client
      .from('professional_profiles')
      .select('profile_id')
      .eq('profile_id', userId)
      .maybeSingle();
    if (!data) throw new Error('Usuário não é uma profissional');
  }

  return {
    async signIn(email, password) {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error || !data.user) {
        throw new Error('E-mail ou senha incorretos');
      }
      return toAuthUser(data.user.id, data.user.email ?? email);
    },

    async signOut() {
      await client.auth.signOut();
    },

    async getSession() {
      const { data } = await client.auth.getSession();
      const user = data.session?.user;
      if (!user) return null;
      return toAuthUser(user.id, user.email ?? '');
    },

    async listProfessionals() {
      const { data, error } = await client
        .from('professional_profiles')
        .select(PROFESSIONAL_SELECT)
        .eq('status', 'ativa');
      if (error) throw new Error('Não foi possível carregar as profissionais');
      return hydrateProfessionals((data ?? []) as unknown as ProfessionalProfileRow[]);
    },

    async getProfessional(id) {
      return fetchProfessional(id);
    },

    async listFavoriteIds(clientId) {
      const { data, error } = await client
        .from('favorites')
        .select('professional_id')
        .eq('client_id', clientId);
      if (error) throw new Error('Não foi possível carregar os favoritos');
      return (data ?? []).map((r) => r.professional_id as string);
    },

    async toggleFavorite(clientId, professionalId) {
      const { data: existing } = await client
        .from('favorites')
        .select('professional_id')
        .eq('client_id', clientId)
        .eq('professional_id', professionalId)
        .maybeSingle();
      if (existing) {
        await client
          .from('favorites')
          .delete()
          .eq('client_id', clientId)
          .eq('professional_id', professionalId);
      } else {
        await client
          .from('favorites')
          .insert({ client_id: clientId, professional_id: professionalId });
      }
      const { data } = await client
        .from('favorites')
        .select('professional_id')
        .eq('client_id', clientId);
      return (data ?? []).map((r) => r.professional_id as string);
    },

    async getAvailableTimes(professionalId, date, serviceId) {
      const [{ data: svc }, { data: slots }, { data: busyAppts }] = await Promise.all([
        client
          .from('professional_services')
          .select('id, name, category, duration_min, price, active')
          .eq('id', serviceId)
          .maybeSingle(),
        client
          .from('availability_slots')
          .select('date, time, all_services, availability_slot_services ( service_id )')
          .eq('professional_id', professionalId)
          .eq('date', date),
        client
          .from('appointments')
          .select('scheduled_time, duration_min')
          .eq('professional_id', professionalId)
          .eq('scheduled_date', date)
          .neq('status', 'cancelado'),
      ]);
      if (!svc || !svc.active) return [];
      const service = toProService(svc as ServiceRow);
      const busy: Array<[number, number]> = (busyAppts ?? []).map((a) => {
        const start = toMinutes((a.scheduled_time as string).slice(0, 5));
        return [start, start + (a.duration_min as number)];
      });
      const daySlots = ((slots ?? []) as SlotRow[]).map(toProAvailabilitySlot);
      return freeTimesForDate(daySlots, date, service, busy);
    },

    async getAvailableDays(professionalId, serviceId) {
      const { data: services } = await client
        .from('professional_services')
        .select('id, name, category, duration_min, price, active')
        .eq('professional_id', professionalId)
        .eq('active', true);
      const activeServices = ((services ?? []) as ServiceRow[])
        .map(toProService)
        .filter((s) => !serviceId || s.id === serviceId);
      if (activeServices.length === 0) return [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = isoFromDate(today);
      const until = new Date(today);
      until.setDate(until.getDate() + 13);
      const untilISO = isoFromDate(until);

      const [{ data: slots }, { data: appts }] = await Promise.all([
        client
          .from('availability_slots')
          .select('date, time, all_services, availability_slot_services ( service_id )')
          .eq('professional_id', professionalId)
          .gte('date', todayISO)
          .lte('date', untilISO),
        client
          .from('appointments')
          .select('scheduled_date, scheduled_time, duration_min')
          .eq('professional_id', professionalId)
          .gte('scheduled_date', todayISO)
          .lte('scheduled_date', untilISO)
          .neq('status', 'cancelado'),
      ]);

      const slotsByDate = groupAvailability((slots ?? []) as SlotRow[]);
      const busyByDate = new Map<string, Array<[number, number]>>();
      for (const a of appts ?? []) {
        const list = busyByDate.get(a.scheduled_date as string) ?? [];
        const start = toMinutes((a.scheduled_time as string).slice(0, 5));
        list.push([start, start + (a.duration_min as number)]);
        busyByDate.set(a.scheduled_date as string, list);
      }

      const result: Array<[string, number]> = [];
      for (let i = 0; i < 14 && result.length < 6; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const iso = isoFromDate(d);
        const busy = busyByDate.get(iso) ?? [];
        const times = new Set<string>();
        for (const svc of activeServices) {
          for (const t of freeTimesForDate(slotsByDate[iso] ?? [], iso, svc, busy)) times.add(t);
        }
        if (times.size) result.push([iso, times.size]);
      }
      return result;
    },

    async listAppointments(clientId) {
      const { data, error } = await client
        .from('appointments')
        .select(
          '*, reviews ( rating, comment ), professional:professional_id ( profiles:profile_id ( name ) )',
        )
        .eq('client_id', clientId)
        .order('scheduled_date', { ascending: false });
      if (error) throw new Error('Não foi possível carregar os agendamentos');
      return (data as unknown as AppointmentRow[]).map(toAppointmentView);
    },

    async createAppointment() {
      throw new Error('Criação de agendamento com validação de servidor chega na Fase 5 (API)');
    },

    async cancelAppointment(clientId, appointmentId) {
      const { data, error } = await client
        .from('appointments')
        .update({ status: 'cancelado' })
        .eq('id', appointmentId)
        .eq('client_id', clientId)
        .select(
          '*, reviews ( rating, comment ), professional:professional_id ( profiles:profile_id ( name ) )',
        )
        .single();
      if (error || !data) throw new Error('Não foi possível cancelar o agendamento');
      return toAppointmentView(data as unknown as AppointmentRow);
    },

    async rateAppointment(clientId, appointmentId, rating, text) {
      const { error } = await client.rpc('rate_appointment', {
        p_appointment_id: appointmentId,
        p_rating: rating,
        p_comment: text,
      });
      if (error) {
        if (error.code === '23505') throw new Error('Este agendamento já foi avaliado');
        throw new Error('Não foi possível registrar a avaliação');
      }
      const { data } = await client
        .from('appointments')
        .select(
          '*, reviews ( rating, comment ), professional:professional_id ( profiles:profile_id ( name ) )',
        )
        .eq('id', appointmentId)
        .eq('client_id', clientId)
        .single();
      return toAppointmentView(data as unknown as AppointmentRow);
    },

    async updateProfile(userId, input) {
      const { error } = await client
        .from('profiles')
        .update({
          name: input.name,
          email: input.email,
          phone: input.phone,
          avatar_url: input.photoUrl,
        })
        .eq('id', userId);
      if (error) throw new Error('Não foi possível atualizar o perfil');
      const current = await client.auth.getSession();
      return toAuthUser(userId, current.data.session?.user.email ?? input.email);
    },

    async requestAccountDeletion(userId) {
      const { error } = await client
        .from('account_deletion_requests')
        .insert({ profile_id: userId });
      if (error) throw new Error('Não foi possível registrar a solicitação');
    },

    async getMyProfessional(userId) {
      const pro = await fetchProfessional(userId);
      if (!pro) throw new Error('Usuário não é uma profissional');
      return pro;
    },

    async listProAppointments(professionalId) {
      const { data, error } = await client
        .from('appointments')
        .select('*, reviews ( rating, comment ), client:client_id ( name, phone )')
        .eq('professional_id', professionalId)
        .order('scheduled_date', { ascending: false });
      if (error) throw new Error('Não foi possível carregar os agendamentos');
      return (data as unknown as ProAppointmentRow[]).map((row) => ({
        ...toAppointmentView({ ...row, professional: null }),
        clientName: row.client?.name ?? '',
        clientPhone: row.client?.phone ?? '',
      }));
    },

    async setAvailabilitySlots(professionalId, date, slots) {
      await client
        .from('availability_slots')
        .delete()
        .eq('professional_id', professionalId)
        .eq('date', date);
      for (const slot of slots) {
        const { data, error } = await client
          .from('availability_slots')
          .insert({
            professional_id: professionalId,
            date,
            time: slot.time,
            all_services: slot.all,
          })
          .select('id')
          .single();
        if (error || !data) throw new Error('Não foi possível salvar a disponibilidade');
        if (!slot.all && slot.serviceIds.length) {
          await client
            .from('availability_slot_services')
            .insert(
              slot.serviceIds.map((serviceId) => ({ slot_id: data.id, service_id: serviceId })),
            );
        }
      }
      const pro = await fetchProfessional(professionalId);
      if (!pro) throw new Error('Profissional não encontrada');
      return pro;
    },

    async removeAvailabilitySlot(professionalId, date, time) {
      await client
        .from('availability_slots')
        .delete()
        .eq('professional_id', professionalId)
        .eq('date', date)
        .eq('time', time);
      const pro = await fetchProfessional(professionalId);
      if (!pro) throw new Error('Profissional não encontrada');
      return pro;
    },

    async updateMyProfessional(professionalId, input) {
      await assertOwnProfessional(professionalId);
      const [{ error: e1 }, { error: e2 }] = await Promise.all([
        client
          .from('profiles')
          .update({
            name: input.name,
            email: input.email,
            phone: input.phone,
            avatar_url: input.photoUrl,
          })
          .eq('id', professionalId),
        client
          .from('professional_profiles')
          .update({ city: input.city, address: input.address })
          .eq('profile_id', professionalId),
      ]);
      if (e1 || e2) throw new Error('Não foi possível atualizar o perfil');
      const pro = await fetchProfessional(professionalId);
      if (!pro) throw new Error('Profissional não encontrada');
      return pro;
    },

    async updatePresentation(professionalId, input) {
      const { error } = await client
        .from('professional_profiles')
        .update({ bio: input.bio, socials: input.socials, photos: input.photos })
        .eq('profile_id', professionalId);
      if (error) throw new Error('Não foi possível atualizar a apresentação');
      const pro = await fetchProfessional(professionalId);
      if (!pro) throw new Error('Profissional não encontrada');
      return pro;
    },

    async saveService(professionalId, input, id) {
      const payload = {
        professional_id: professionalId,
        name: input.name,
        category: input.category,
        duration_min: input.durationMin,
        price: input.price,
        active: input.active,
      };
      const { error } = id
        ? await client
            .from('professional_services')
            .update(payload)
            .eq('id', id)
            .eq('professional_id', professionalId)
        : await client.from('professional_services').insert(payload);
      if (error) throw new Error('Não foi possível salvar o serviço');
      const pro = await fetchProfessional(professionalId);
      if (!pro) throw new Error('Profissional não encontrada');
      return pro;
    },

    async toggleServiceActive(professionalId, serviceId) {
      const { data: svc } = await client
        .from('professional_services')
        .select('active')
        .eq('id', serviceId)
        .single();
      await client
        .from('professional_services')
        .update({ active: !svc?.active })
        .eq('id', serviceId)
        .eq('professional_id', professionalId);
      const pro = await fetchProfessional(professionalId);
      if (!pro) throw new Error('Profissional não encontrada');
      return pro;
    },

    async deleteService(professionalId, serviceId) {
      await client
        .from('professional_services')
        .delete()
        .eq('id', serviceId)
        .eq('professional_id', professionalId);
      const pro = await fetchProfessional(professionalId);
      if (!pro) throw new Error('Profissional não encontrada');
      return pro;
    },

    async addDocument(professionalId, doc) {
      const { error } = await client
        .from('professional_documents')
        .insert({
          professional_id: professionalId,
          name: doc.name,
          size: doc.size,
          type: doc.type,
        });
      if (error) throw new Error('Não foi possível anexar o documento');
      const pro = await fetchProfessional(professionalId);
      if (!pro) throw new Error('Profissional não encontrada');
      return pro;
    },

    async removeDocument(professionalId, docId) {
      await client
        .from('professional_documents')
        .delete()
        .eq('id', docId)
        .eq('professional_id', professionalId);
      const pro = await fetchProfessional(professionalId);
      if (!pro) throw new Error('Profissional não encontrada');
      return pro;
    },

    async savePayout(professionalId, pix, bank) {
      const { error } = await client
        .from('professional_profiles')
        .update({ pix_key: pix.key, pix_type: pix.type, bank_info: bank })
        .eq('profile_id', professionalId);
      if (error) throw new Error('Não foi possível salvar os dados de recebimento');
      const pro = await fetchProfessional(professionalId);
      if (!pro) throw new Error('Profissional não encontrada');
      return pro;
    },

    async listExpenses(professionalId) {
      const { data, error } = await client
        .from('expenses')
        .select('id, description, amount, category, created_at')
        .eq('professional_id', professionalId)
        .order('created_at', { ascending: false });
      if (error) throw new Error('Não foi possível carregar as despesas');
      return (data ?? []).map((row): Expense => ({
        id: row.id as string,
        professionalId,
        desc: row.description as string,
        val: Number(row.amount),
        cat: row.category as string,
        date: (row.created_at as string).slice(0, 10),
      }));
    },

    async createExpense(professionalId, input: CreateExpenseInput) {
      const { data, error } = await client
        .from('expenses')
        .insert({
          professional_id: professionalId,
          description: input.desc,
          amount: input.val,
          category: input.cat,
        })
        .select('id, description, amount, category, created_at')
        .single();
      if (error || !data) throw new Error('Não foi possível registrar a despesa');
      return {
        id: data.id as string,
        professionalId,
        desc: data.description as string,
        val: Number(data.amount),
        cat: data.category as string,
        date: (data.created_at as string).slice(0, 10),
      };
    },

    // Painel administrativo (moderação, financeiro da plataforma, repasses, disputas e
    // configuração) fica fora do escopo da Fase 4 — o "ponto de partida" do plano só lista
    // profissionais/serviços/perfil/agendamentos/exclusão de conta como integrados; admin
    // entra junto com os endpoints de POST /payouts e afins na Fase 5 (API).
    listAdminProfessionals: admin404,
    adminProfessionalAction: admin404,
    listAdminClients: admin404,
    toggleAdminClientBlock: admin404,
    getAdminFinance: admin404,
    listAdminPayouts: admin404,
    processAdminPayout: admin404,
    processAllAdminPayouts: admin404,
    listAdminDisputes: admin404,
    resolveAdminDispute: admin404,
    getAdminConfig: admin404,
    saveAdminConfig: admin404,
    toggleAdminConfigFlag: admin404,
    toggleAdminMaintenance: admin404,
  };
}

interface AppointmentRow {
  id: string;
  professional_id: string;
  service_name: string;
  category: string;
  duration_min: number;
  price: number | string;
  home_fee: number | string;
  scheduled_date: string;
  scheduled_time: string;
  location: string;
  status: string;
  reviews: Array<{ rating: number; comment: string | null }> | null;
  professional: { profiles: { name: string } | null } | null;
}

interface ProAppointmentRow extends AppointmentRow {
  client: { name: string; phone: string | null } | null;
}
