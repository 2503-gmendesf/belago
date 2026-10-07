import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { freeTimesForDate, type Role } from '@belago/shared';
import { env } from '../env.js';
import type { AppointmentLocation, AppointmentView } from '../features/appointments/types.js';
import type {
  AdminClient,
  AdminConfig,
  AdminConfigToggles,
  AdminDispute,
  AdminFinancePeriod,
  AdminFinanceSnapshot,
  AdminOverview,
  AdminPayout,
  AdminProfAction,
  AdminProfessional,
  AdminProfStatus,
  DisputeResolution,
} from '../features/admin/types.js';
import { addDays, isoFromDate, todayISO, toMinutes } from '../lib/format.js';
import type {
  ProAvailabilitySlot,
  ProBankInfo,
  ProPixInfo,
  Professional,
  ProService,
} from '../features/discovery/types.js';
import {
  NOTIFICATION_ICON,
  type AppNotification,
  type NotificationType,
} from '../features/notifications/types.js';
import type { CreateExpenseInput, Expense } from '../features/proFinance/types.js';
import type { AuthUser, DataSource } from './types.js';

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

export function createSupabaseDataSource(): DataSource {
  const client: SupabaseClient = createClient(env.supabaseUrl, env.supabaseAnonKey);

  async function fetchNotifications(userId: string): Promise<AppNotification[]> {
    const { data, error } = await client
      .from('notifications')
      .select('id, icon, title, body, read, created_at')
      .eq('profile_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error('Não foi possível carregar as notificações');
    return (data ?? []).map((row): AppNotification => ({
      id: row.id as string,
      type: (row.icon && row.icon in NOTIFICATION_ICON ? row.icon : 'sistema') as NotificationType,
      title: row.title as string,
      body: row.body as string,
      at: row.created_at as string,
      read: Boolean(row.read),
    }));
  }

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

  async function callApi(method: 'POST' | 'DELETE', path: string, body?: unknown): Promise<void> {
    if (!env.apiUrl) throw new Error('API não configurada (VITE_API_URL)');
    const { data } = await client.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error('Sessão expirada. Entre novamente.');
    let res: Response;
    try {
      res = await fetch(`${env.apiUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new Error('Não foi possível falar com o servidor. Tente novamente.');
    }
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as { message?: string } | null;
      throw new Error(err?.message ?? 'Não foi possível concluir a operação');
    }
  }

  async function assertOwnProfessional(userId: string): Promise<void> {
    const { data } = await client
      .from('professional_profiles')
      .select('profile_id')
      .eq('profile_id', userId)
      .maybeSingle();
    if (!data) throw new Error('Usuário não é uma profissional');
  }

  async function countRows(
    query: PromiseLike<{ count: number | null; error: { message: string } | null }>,
  ): Promise<number> {
    const { count, error } = await query;
    if (error) throw new Error('Não foi possível carregar os números do painel');
    return count ?? 0;
  }

  async function listAdminProfessionals(): Promise<AdminProfessional[]> {
    const { data, error } = await client
      .from('professional_profiles')
      .select('profile_id, specialty, city, status, rating, profiles:profile_id ( name ), appointments ( count )')
      .order('created_at', { ascending: false });
    if (error) throw new Error('Não foi possível carregar as profissionais');
    return ((data ?? []) as unknown as AdminProfessionalRow[]).map((row) => ({
      id: row.profile_id,
      name: row.profiles?.name ?? 'Profissional',
      spec: row.specialty,
      city: row.city ?? '—',
      status: row.status as AdminProfStatus,
      rating: Number(row.rating),
      appointmentsCount: row.appointments?.[0]?.count ?? 0,
    }));
  }

  async function listAdminClients(): Promise<AdminClient[]> {
    const { data, error } = await client
      .from('profiles')
      .select('id, name, email, blocked, appointments ( count )')
      .eq('role', 'cliente')
      .order('created_at', { ascending: false });
    if (error) throw new Error('Não foi possível carregar as clientes');
    return ((data ?? []) as unknown as AdminClientRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      appointmentsCount: row.appointments?.[0]?.count ?? 0,
      status: row.blocked ? 'bloqueada' : 'ativa',
    }));
  }

  async function listAdminPayouts(): Promise<AdminPayout[]> {
    const { data, error } = await client
      .from('payouts')
      .select('id, amount, status, professional_profiles ( specialty, profiles:profile_id ( name ) ), payments ( count )')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw new Error('Não foi possível carregar os repasses');
    return ((data ?? []) as unknown as AdminPayoutRow[]).map((row) => ({
      id: row.id,
      name: row.professional_profiles?.profiles?.name ?? 'Profissional',
      count: row.payments?.[0]?.count ?? 0,
      spec: row.professional_profiles?.specialty ?? '',
      value: Number(row.amount),
      done: row.status === 'processado',
    }));
  }

  async function listAdminDisputes(): Promise<AdminDispute[]> {
    const { data, error } = await client
      .from('disputes')
      .select(
        'id, reason, created_at, appointment:appointment_id ( price, home_fee, client:client_id ( name ), professional:professional_id ( profiles:profile_id ( name ) ) )',
      )
      .eq('status', 'aberta')
      .order('created_at', { ascending: false });
    if (error) throw new Error('Não foi possível carregar as disputas');
    return ((data ?? []) as unknown as AdminDisputeRow[]).map((row) => {
      const [, month, day] = row.created_at.slice(0, 10).split('-');
      return {
        id: row.id,
        clientName: row.appointment?.client?.name ?? 'Cliente',
        professionalName: row.appointment?.professional?.profiles?.name ?? 'Profissional',
        value: Number(row.appointment?.price ?? 0) + Number(row.appointment?.home_fee ?? 0),
        reason: row.reason,
        date: `${day}/${month}`,
      };
    });
  }

  const CONFIG_SELECT =
    'commission_pct, min_deposit, payout_days, home_fee, late_cancel_penalty_pct, maintenance_mode, toggles';

  function toAdminConfig(row: PlatformConfigRow): AdminConfig {
    return {
      commissionPct: Number(row.commission_pct),
      depositMin: Number(row.min_deposit),
      payoutDays: row.payout_days,
      homeFee: Number(row.home_fee),
      lateFeePct: Number(row.late_cancel_penalty_pct),
      maintenance: row.maintenance_mode,
      toggles: { verify: true, identity: true, certs: false, reviews: true, portfolio: false, ...row.toggles },
    };
  }

  async function getAdminConfig(): Promise<AdminConfig> {
    const { data, error } = await client.from('platform_config').select(CONFIG_SELECT).eq('id', 1).maybeSingle();
    if (error || !data) throw new Error('Não foi possível carregar as configurações');
    return toAdminConfig(data as unknown as PlatformConfigRow);
  }

  async function updateAdminConfig(patch: Record<string, unknown>): Promise<AdminConfig> {
    const { data, error } = await client.from('platform_config').update(patch).eq('id', 1).select(CONFIG_SELECT).single();
    if (error || !data) throw new Error('Não foi possível salvar as configurações');
    return toAdminConfig(data as unknown as PlatformConfigRow);
  }

  return {
    async signIn(email, password) {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error || !data.user) {
        throw new Error('E-mail ou senha incorretos');
      }
      return toAuthUser(data.user.id, data.user.email ?? email);
    },

    async signUp({ name, email, phone, password }) {
      // O papel nunca vem do cliente: o trigger handle_new_user cria o perfil como 'cliente' por padrão.
      const { data, error } = await client.auth.signUp({ email, password, options: { data: { name } } });
      if (error) {
        throw new Error(
          /registered/i.test(error.message) ? 'Este e-mail já está cadastrado' : 'Não foi possível criar a conta',
        );
      }
      if (!data.user || !data.session) return null;
      if (phone) await client.from('profiles').update({ phone }).eq('id', data.user.id);
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

    async createAppointment(clientId, input) {
      // Preço, comissão e disponibilidade são validados na API; o front só envia a intenção.
      await callApi('POST', '/appointments', {
        professionalId: input.professionalId,
        serviceId: input.serviceId,
        scheduledDate: input.scheduledDate,
        scheduledTime: input.scheduledTime,
        location: input.location,
        address: input.address || undefined,
      });
      const { data } = await client
        .from('appointments')
        .select(
          '*, reviews ( rating, comment ), professional:professional_id ( profiles:profile_id ( name ) )',
        )
        .eq('client_id', clientId)
        .eq('professional_id', input.professionalId)
        .eq('scheduled_date', input.scheduledDate)
        .eq('scheduled_time', input.scheduledTime)
        .neq('status', 'cancelado')
        .single();
      return toAppointmentView(data as unknown as AppointmentRow);
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

    async requestAccountDeletion() {
      // A exclusão (LGPD) roda na API: exige service_role para remover o acesso em auth.users.
      await callApi('DELETE', '/account');
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

    async listNotifications(userId) {
      return fetchNotifications(userId);
    },

    async markNotificationsRead(userId) {
      const { error } = await client
        .from('notifications')
        .update({ read: true })
        .eq('profile_id', userId)
        .eq('read', false);
      if (error) throw new Error('Não foi possível atualizar as notificações');
      return fetchNotifications(userId);
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

    // Painel administrativo: leituras e edições passam pelo RLS (o admin tem acesso); só repasses
    // (gerar/processar) vão pela API, que usa service_role.
    async getAdminOverview(): Promise<AdminOverview> {
      const today = todayISO();
      const yesterday = addDays(today, -1);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const now = new Date();
      const prevMonthStart = isoFromDate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      const monthStart = isoFromDate(new Date(now.getFullYear(), now.getMonth(), 1));
      const nextMonthStart = isoFromDate(new Date(now.getFullYear(), now.getMonth() + 1, 1));

      const head = { count: 'exact', head: true } as const;
      const [clients, clientsWeek, professionals, professionalsWeek, appointmentsToday, appointmentsYesterday, gmvRows] =
        await Promise.all([
          countRows(client.from('profiles').select('id', head).eq('role', 'cliente')),
          countRows(client.from('profiles').select('id', head).eq('role', 'cliente').gte('created_at', weekAgo)),
          countRows(client.from('professional_profiles').select('profile_id', head).eq('status', 'ativa')),
          countRows(
            client
              .from('professional_profiles')
              .select('profile_id', head)
              .eq('status', 'ativa')
              .gte('created_at', weekAgo),
          ),
          countRows(
            client.from('appointments').select('id', head).eq('scheduled_date', today).neq('status', 'cancelado'),
          ),
          countRows(
            client.from('appointments').select('id', head).eq('scheduled_date', yesterday).neq('status', 'cancelado'),
          ),
          client
            .from('appointments')
            .select('price, home_fee, scheduled_date, professional_profiles ( city )')
            .in('status', ['confirmado', 'realizado'])
            .gte('scheduled_date', prevMonthStart)
            .lt('scheduled_date', nextMonthStart),
        ]);
      if (gmvRows.error) throw new Error('Não foi possível carregar os números do painel');

      let gmvMonth = 0;
      let gmvPrevMonth = 0;
      const byCity = new Map<string, number>();
      for (const row of (gmvRows.data ?? []) as unknown as OverviewAppointmentRow[]) {
        const value = Number(row.price) + Number(row.home_fee);
        if (row.scheduled_date >= monthStart) {
          gmvMonth += value;
          const city = row.professional_profiles?.city || 'Sem cidade';
          byCity.set(city, (byCity.get(city) ?? 0) + 1);
        } else {
          gmvPrevMonth += value;
        }
      }
      const zones = [...byCity.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

      return {
        clients,
        clientsWeek,
        professionals,
        professionalsWeek,
        appointmentsToday,
        appointmentsYesterday,
        gmvMonth,
        gmvPrevMonth,
        zones,
      };
    },

    listAdminProfessionals,

    async adminProfessionalAction(id: string, action: AdminProfAction) {
      if (action === 'advertir' || action === 'solicitar') {
        // O RLS de notifications só deixa o dono gravar; o envio para outra usuária fica para a API.
        throw new Error('Avisos à profissional ainda não estão disponíveis.');
      }
      const patch: Record<AdminProfAction, { status: AdminProfStatus; verified_at?: string } | null> = {
        aprovar: { status: 'ativa', verified_at: new Date().toISOString() },
        reativar: { status: 'ativa' },
        suspender: { status: 'suspensa' },
        excluir: { status: 'excluida' },
        advertir: null,
        solicitar: null,
      };
      const { data, error } = await client
        .from('professional_profiles')
        .update(patch[action]!)
        .eq('profile_id', id)
        .select('profile_id');
      if (error || !data?.length) throw new Error('Não foi possível atualizar a profissional');
      return listAdminProfessionals();
    },

    listAdminClients,

    async toggleAdminClientBlock(id) {
      const { error } = await client.rpc('admin_toggle_client_blocked', { p_id: id });
      if (error) throw new Error('Não foi possível alterar o bloqueio da cliente');
      return listAdminClients();
    },

    async getAdminFinance(period: AdminFinancePeriod): Promise<AdminFinanceSnapshot> {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth();
      let start: Date;
      let end: Date;
      let buckets: number;
      let bucketOf: (d: Date) => number;
      if (period === 'semana') {
        start = new Date(y, m, now.getDate() - 6);
        end = new Date(y, m, now.getDate() + 1);
        buckets = 1;
        bucketOf = () => 0;
      } else if (period === 'mes') {
        start = new Date(y, m, 1);
        end = new Date(y, m + 1, 1);
        buckets = 4;
        bucketOf = (d) => Math.min(3, Math.floor((d.getDate() - 1) / 7));
      } else if (period === 'trim') {
        const first = new Date(y, m - 2, 1);
        start = first;
        end = new Date(y, m + 1, 1);
        buckets = 3;
        bucketOf = (d) => (d.getFullYear() - first.getFullYear()) * 12 + d.getMonth() - first.getMonth();
      } else {
        start = new Date(y, 0, 1);
        end = new Date(y + 1, 0, 1);
        buckets = 4;
        bucketOf = (d) => Math.floor(d.getMonth() / 3);
      }

      const { data, error } = await client
        .from('payments')
        .select('amount, platform_fee, net_amount, paid_at, payouts ( status )')
        .gte('paid_at', start.toISOString())
        .lt('paid_at', end.toISOString());
      if (error) throw new Error('Não foi possível carregar o financeiro');

      const rows = (data ?? []) as unknown as FinancePaymentRow[];
      const weekly: Array<[number, number]> = Array.from({ length: buckets }, () => [0, 0]);
      let gmv = 0;
      let platform = 0;
      let paid = 0;
      let pending = 0;
      for (const row of rows) {
        const fee = Number(row.platform_fee);
        const net = Number(row.net_amount);
        gmv += Number(row.amount);
        platform += fee;
        if (row.payouts?.status === 'processado') paid += net;
        else pending += net;
        const bucket = weekly[bucketOf(new Date(row.paid_at))];
        if (bucket) {
          bucket[0] += fee;
          bucket[1] += net;
        }
      }
      return { gmv, platform, paid, pending, avgFee: rows.length ? platform / rows.length : 0, weekly };
    },

    listAdminPayouts,

    async generateAdminPayouts() {
      const { data, error } = await client
        .from('payments')
        .select('paid_at, appointments!inner ( professional_id, status )')
        .is('payout_id', null)
        .not('paid_at', 'is', null)
        .neq('appointments.status', 'cancelado');
      if (error) throw new Error('Não foi possível consultar os pagamentos a repassar');

      // Uma profissional por repasse; o período começa no pagamento mais antigo ainda não repassado.
      const firstPaid = new Map<string, string>();
      for (const row of (data ?? []) as unknown as UnpaidPaymentRow[]) {
        const proId = row.appointments.professional_id;
        const day = row.paid_at.slice(0, 10);
        const current = firstPaid.get(proId);
        if (!current || day < current) firstPaid.set(proId, day);
      }

      // periodEnd = amanhã: create_payout compara paid_at (UTC) com o fim do dia, e "hoje" local pode já ser amanhã em UTC.
      const periodEnd = addDays(todayISO(), 1);
      let failures = 0;
      let firstError: Error | null = null;
      for (const [professionalId, periodStart] of firstPaid) {
        try {
          await callApi('POST', '/payouts', { professionalId, periodStart, periodEnd });
        } catch (e) {
          failures += 1;
          firstError ??= e instanceof Error ? e : new Error('Não foi possível gerar o repasse');
        }
      }
      if (failures && failures === firstPaid.size && firstError) throw firstError;
      return listAdminPayouts();
    },

    async processAdminPayout(id) {
      await callApi('POST', `/payouts/${id}/process`);
      return listAdminPayouts();
    },

    async processAllAdminPayouts() {
      const pending = (await listAdminPayouts()).filter((p) => !p.done);
      let failures = 0;
      for (const payout of pending) {
        try {
          await callApi('POST', `/payouts/${payout.id}/process`);
        } catch {
          failures += 1;
        }
      }
      if (failures) throw new Error(`${failures} repasse(s) não puderam ser processados`);
      return listAdminPayouts();
    },

    listAdminDisputes,

    async resolveAdminDispute(id, resolution: DisputeResolution) {
      const { data, error } = await client
        .from('disputes')
        .update({
          status: resolution === 'reembolso' ? 'resolvida' : 'rejeitada',
          resolution,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('status', 'aberta')
        .select('id');
      if (error || !data?.length) throw new Error('Não foi possível resolver a disputa');
      return listAdminDisputes();
    },

    getAdminConfig,

    async saveAdminConfig(rates) {
      return updateAdminConfig({
        commission_pct: rates.commissionPct,
        min_deposit: rates.depositMin,
        payout_days: rates.payoutDays,
        home_fee: rates.homeFee,
        late_cancel_penalty_pct: rates.lateFeePct,
      });
    },

    async toggleAdminConfigFlag(key) {
      const current = await getAdminConfig();
      return updateAdminConfig({ toggles: { ...current.toggles, [key]: !current.toggles[key] } });
    },

    async toggleAdminMaintenance() {
      const current = await getAdminConfig();
      return updateAdminConfig({ maintenance_mode: !current.maintenance });
    },
  };
}

interface AdminProfessionalRow {
  profile_id: string;
  specialty: string;
  city: string | null;
  status: string;
  rating: number | string;
  profiles: { name: string } | null;
  appointments: Array<{ count: number }> | null;
}

interface AdminClientRow {
  id: string;
  name: string;
  email: string;
  blocked: boolean;
  appointments: Array<{ count: number }> | null;
}

interface AdminPayoutRow {
  id: string;
  amount: number | string;
  status: 'pendente' | 'processado';
  professional_profiles: { specialty: string; profiles: { name: string } | null } | null;
  payments: Array<{ count: number }> | null;
}

interface AdminDisputeRow {
  id: string;
  reason: string;
  created_at: string;
  appointment: {
    price: number | string;
    home_fee: number | string;
    client: { name: string } | null;
    professional: { profiles: { name: string } | null } | null;
  } | null;
}

interface FinancePaymentRow {
  amount: number | string;
  platform_fee: number | string;
  net_amount: number | string;
  paid_at: string;
  payouts: { status: 'pendente' | 'processado' } | null;
}

interface UnpaidPaymentRow {
  paid_at: string;
  appointments: { professional_id: string };
}

interface PlatformConfigRow {
  commission_pct: number | string;
  min_deposit: number | string;
  payout_days: number;
  home_fee: number | string;
  late_cancel_penalty_pct: number | string;
  maintenance_mode: boolean;
  toggles: Partial<AdminConfigToggles> | null;
}

interface OverviewAppointmentRow {
  price: number | string;
  home_fee: number | string;
  scheduled_date: string;
  professional_profiles: { city: string | null } | null;
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
