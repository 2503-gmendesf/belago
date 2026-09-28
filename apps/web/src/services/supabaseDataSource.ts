import { createClient } from '@supabase/supabase-js';
import type { Role } from '@belago/shared';
import { env } from '../env.js';
import type { AuthUser, DataSource } from './types.js';

export function createSupabaseDataSource(): DataSource {
  const client = createClient(env.supabaseUrl, env.supabaseAnonKey);

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
      throw new Error('DataSource Supabase para profissionais chega na Fase 4');
    },

    async getProfessional() {
      throw new Error('DataSource Supabase para profissionais chega na Fase 4');
    },

    async listFavoriteIds() {
      throw new Error('DataSource Supabase para favoritos chega na Fase 4');
    },

    async toggleFavorite() {
      throw new Error('DataSource Supabase para favoritos chega na Fase 4');
    },

    async getAvailableTimes() {
      throw new Error('DataSource Supabase para disponibilidade chega na Fase 4');
    },

    async getAvailableDays() {
      throw new Error('DataSource Supabase para disponibilidade chega na Fase 4');
    },

    async listAppointments() {
      throw new Error('DataSource Supabase para agendamentos chega na Fase 4');
    },

    async createAppointment() {
      throw new Error('Criação de agendamento com validação de servidor chega na Fase 5 (API)');
    },

    async cancelAppointment() {
      throw new Error('DataSource Supabase para agendamentos chega na Fase 4');
    },

    async rateAppointment() {
      throw new Error('DataSource Supabase para avaliações chega na Fase 4');
    },

    async updateProfile() {
      throw new Error('DataSource Supabase para perfil chega na Fase 4');
    },

    async requestAccountDeletion() {
      throw new Error('Exclusão de conta (LGPD) chega na Fase 5 (API)');
    },

    async getMyProfessional() {
      throw new Error('DataSource Supabase para profissionais chega na Fase 4');
    },

    async listProAppointments() {
      throw new Error('DataSource Supabase para agendamentos chega na Fase 4');
    },

    async setAvailabilitySlots() {
      throw new Error('DataSource Supabase para disponibilidade chega na Fase 4');
    },

    async removeAvailabilitySlot() {
      throw new Error('DataSource Supabase para disponibilidade chega na Fase 4');
    },

    async updateMyProfessional() {
      throw new Error('DataSource Supabase para profissionais chega na Fase 4');
    },

    async updatePresentation() {
      throw new Error('DataSource Supabase para profissionais chega na Fase 4');
    },

    async saveService() {
      throw new Error('DataSource Supabase para serviços chega na Fase 4');
    },

    async toggleServiceActive() {
      throw new Error('DataSource Supabase para serviços chega na Fase 4');
    },

    async deleteService() {
      throw new Error('DataSource Supabase para serviços chega na Fase 4');
    },

    async addDocument() {
      throw new Error('DataSource Supabase para documentações chega na Fase 4');
    },

    async removeDocument() {
      throw new Error('DataSource Supabase para documentações chega na Fase 4');
    },

    async savePayout() {
      throw new Error('DataSource Supabase para dados de recebimento chega na Fase 4');
    },

    async listExpenses() {
      throw new Error('DataSource Supabase para despesas chega na Fase 4');
    },

    async createExpense() {
      throw new Error('DataSource Supabase para despesas chega na Fase 4');
    },

    async listAdminProfessionals() {
      throw new Error('DataSource Supabase para admin chega na Fase 4');
    },

    async adminProfessionalAction() {
      throw new Error('DataSource Supabase para admin chega na Fase 4');
    },

    async listAdminClients() {
      throw new Error('DataSource Supabase para admin chega na Fase 4');
    },

    async toggleAdminClientBlock() {
      throw new Error('DataSource Supabase para admin chega na Fase 4');
    },

    async getAdminFinance() {
      throw new Error('DataSource Supabase para admin chega na Fase 4');
    },

    async listAdminPayouts() {
      throw new Error('DataSource Supabase para admin chega na Fase 4');
    },

    async processAdminPayout() {
      throw new Error('DataSource Supabase para admin chega na Fase 4');
    },

    async processAllAdminPayouts() {
      throw new Error('DataSource Supabase para admin chega na Fase 4');
    },

    async listAdminDisputes() {
      throw new Error('DataSource Supabase para admin chega na Fase 4');
    },

    async resolveAdminDispute() {
      throw new Error('DataSource Supabase para admin chega na Fase 4');
    },

    async getAdminConfig() {
      throw new Error('DataSource Supabase para admin chega na Fase 4');
    },

    async saveAdminConfig() {
      throw new Error('DataSource Supabase para admin chega na Fase 4');
    },

    async toggleAdminConfigFlag() {
      throw new Error('DataSource Supabase para admin chega na Fase 4');
    },

    async toggleAdminMaintenance() {
      throw new Error('DataSource Supabase para admin chega na Fase 4');
    },
  };
}
