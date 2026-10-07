import { toMinutes, type AvailabilitySlotInput, type BusyInterval } from '@belago/shared';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Config } from './config.js';
import {
  NothingToPayoutError,
  SlotTakenError,
  type Authenticator,
  type PayoutRecord,
  type Repo,
} from './repo.js';

interface PayoutRow {
  id: string;
  professional_id: string;
  amount: number | string;
  status: 'pendente' | 'processado';
}

function toPayout(row: PayoutRow): PayoutRecord {
  return {
    id: row.id,
    professionalId: row.professional_id,
    amount: Number(row.amount),
    status: row.status,
  };
}

/** Cliente com a service_role key: ignora RLS, por isso só vive na API e as rotas validam tudo antes. */
export function createServiceClient(config: Pick<Config, 'supabaseUrl' | 'serviceRoleKey'>): SupabaseClient {
  return createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createSupabaseAuthenticator(db: SupabaseClient): Authenticator {
  return async (token) => {
    const { data, error } = await db.auth.getUser(token);
    if (error || !data.user) return null;
    const { data: profile } = await db.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
    if (!profile) return null;
    return { id: data.user.id, role: profile.role as 'cliente' | 'profissional' | 'admin' };
  };
}

export function createSupabaseRepo(db: SupabaseClient): Repo {
  return {
    async getProfessionalStatus(id) {
      const { data } = await db.from('professional_profiles').select('status').eq('profile_id', id).maybeSingle();
      return (data?.status as string | undefined) ?? null;
    },

    async getService(id) {
      const { data } = await db
        .from('professional_services')
        .select('id, professional_id, name, category, duration_min, price, active')
        .eq('id', id)
        .maybeSingle();
      if (!data) return null;
      return {
        id: data.id as string,
        professionalId: data.professional_id as string,
        name: data.name as string,
        category: data.category as never,
        durationMin: data.duration_min as number,
        price: Number(data.price),
        active: data.active as boolean,
      };
    },

    async isMaintenanceMode() {
      const { data } = await db.from('platform_config').select('maintenance_mode').eq('id', 1).maybeSingle();
      return Boolean(data?.maintenance_mode);
    },

    async isClientBlocked(id) {
      const { data } = await db.from('profiles').select('blocked').eq('id', id).maybeSingle();
      return Boolean(data?.blocked);
    },

    async listDaySlots(professionalId, date) {
      const { data, error } = await db
        .from('availability_slots')
        .select('time, all_services, availability_slot_services ( service_id )')
        .eq('professional_id', professionalId)
        .eq('date', date);
      if (error) throw error;
      return (data ?? []).map(
        (row): AvailabilitySlotInput => ({
          time: (row.time as string).slice(0, 5),
          all: row.all_services as boolean,
          serviceIds: ((row.availability_slot_services ?? []) as Array<{ service_id: string }>).map(
            (s) => s.service_id,
          ),
        }),
      );
    },

    async listBusyIntervals(professionalId, date) {
      const { data, error } = await db
        .from('appointments')
        .select('scheduled_time, duration_min')
        .eq('professional_id', professionalId)
        .eq('scheduled_date', date)
        .neq('status', 'cancelado');
      if (error) throw error;
      return (data ?? []).map((a): BusyInterval => {
        const start = toMinutes((a.scheduled_time as string).slice(0, 5));
        return [start, start + (a.duration_min as number)];
      });
    },

    async insertAppointment(input) {
      let addressId: string | null = null;
      if (input.address) {
        const { data: addr, error: addrErr } = await db
          .from('addresses')
          .insert({ profile_id: input.clientId, label: 'Atendimento', street: input.address })
          .select('id')
          .single();
        if (addrErr) throw addrErr;
        addressId = addr.id as string;
      }

      const { data, error } = await db
        .from('appointments')
        .insert({
          client_id: input.clientId,
          professional_id: input.professionalId,
          service_id: input.serviceId,
          service_name: input.serviceName,
          category: input.category,
          duration_min: input.durationMin,
          price: input.price,
          home_fee: input.homeFee,
          scheduled_date: input.scheduledDate,
          scheduled_time: input.scheduledTime,
          location: input.location,
          address_id: addressId,
        })
        .select('id')
        .single();
      if (error) {
        // 23P01: sobreposição rejeitada pelo trigger trg_appt_no_overlap (corrida entre duas requisições).
        if (error.code === '23P01') throw new SlotTakenError();
        throw error;
      }
      return { id: data.id as string };
    },

    async getAppointment(id) {
      const { data } = await db
        .from('appointments')
        .select('id, client_id, professional_id, status, price, home_fee')
        .eq('id', id)
        .maybeSingle();
      if (!data) return null;
      return {
        id: data.id as string,
        clientId: data.client_id as string,
        professionalId: data.professional_id as string,
        status: data.status as string,
        price: Number(data.price),
        homeFee: Number(data.home_fee),
      };
    },

    async recordPayment(payment) {
      const { error } = await db.from('payments').insert({
        appointment_id: payment.appointmentId,
        amount: payment.amount,
        platform_fee: payment.platformFee,
        net_amount: payment.netAmount,
        method: payment.method,
        provider_ref: payment.providerRef,
        paid_at: new Date().toISOString(),
      });
      // 23505: provider_ref (ou appointment_id) já registrado, ou seja, reentrega do mesmo evento.
      if (error?.code === '23505') return false;
      if (error) throw error;

      const { error: updErr } = await db
        .from('appointments')
        .update({ status: 'confirmado', deposit_paid: true, payment_method: payment.method })
        .eq('id', payment.appointmentId)
        .eq('status', 'pendente');
      if (updErr) throw updErr;
      return true;
    },

    async deleteAccount(userId) {
      const nowISO = new Date().toISOString();
      const today = nowISO.slice(0, 10);

      const { data: request, error: reqErr } = await db
        .from('account_deletion_requests')
        .insert({ profile_id: userId })
        .select('id')
        .single();
      if (reqErr) throw reqErr;

      // Agendamentos futuros ativos são cancelados; os passados ficam (histórico financeiro) mas anonimizados.
      for (const col of ['client_id', 'professional_id']) {
        const { error } = await db
          .from('appointments')
          .update({ status: 'cancelado', cancel_reason: 'Conta excluída' })
          .eq(col, userId)
          .in('status', ['pendente', 'confirmado'])
          .gte('scheduled_date', today);
        if (error) throw error;
      }

      await db.from('professional_profiles').update({ status: 'excluida', online: false }).eq('profile_id', userId);
      await db.from('professional_profiles').update({ pix_key: null, bank_info: null }).eq('profile_id', userId);
      await db.from('professional_documents').delete().eq('professional_id', userId);
      await db.from('addresses').delete().eq('profile_id', userId);
      await db.from('favorites').delete().eq('client_id', userId);
      await db.from('notifications').delete().eq('profile_id', userId);

      const { error: profErr } = await db
        .from('profiles')
        .update({
          name: 'Conta excluída',
          email: `excluida+${userId}@belago.invalid`,
          phone: null,
          avatar_url: null,
          gender: null,
          birth_date: null,
        })
        .eq('id', userId);
      if (profErr) throw profErr;

      // Soft delete: mantém a linha em auth.users, então o cascade não apaga profiles/appointments
      // (FKs de histórico financeiro), mas o login deixa de funcionar e o e-mail é liberado.
      const { error: authErr } = await db.auth.admin.deleteUser(userId, true);
      if (authErr) throw authErr;

      await db
        .from('account_deletion_requests')
        .update({ processed_at: nowISO, processed_by: userId })
        .eq('id', request.id as string);
    },

    async createPayout(professionalId, periodStart, periodEnd) {
      const { data, error } = await db.rpc('create_payout', {
        p_professional_id: professionalId,
        p_period_start: periodStart,
        p_period_end: periodEnd,
      });
      // P0002: a função não encontrou pagamentos a repassar.
      if (error?.code === 'P0002') throw new NothingToPayoutError();
      if (error) throw error;
      return toPayout(data as PayoutRow);
    },

    async processPayout(id) {
      const { data, error } = await db
        .from('payouts')
        .update({ status: 'processado', processed_at: new Date().toISOString() })
        .eq('id', id)
        .eq('status', 'pendente')
        .select('id, professional_id, amount, status')
        .maybeSingle();
      if (error) throw error;
      return data ? toPayout(data as PayoutRow) : null;
    },

    async notify(profileId, title, body) {
      const { error } = await db.from('notifications').insert({ profile_id: profileId, title, body });
      if (error) throw error;
    },
  };
}
