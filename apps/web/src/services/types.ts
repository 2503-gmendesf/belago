import type { Role } from '@belago/shared';
import type { AppointmentView, CreateAppointmentInput, ProAppointmentView } from '../features/appointments/types.js';
import type {
  ProAvailabilitySlot,
  ProBankInfo,
  ProDocument,
  ProPixInfo,
  Professional,
  ProServiceInput,
} from '../features/discovery/types.js';
import type { CreateExpenseInput, Expense } from '../features/proFinance/types.js';
import type {
  AdminClient,
  AdminConfig,
  AdminDispute,
  AdminFinancePeriod,
  AdminFinanceSnapshot,
  AdminPayout,
  AdminProfAction,
  AdminProfessional,
  DisputeResolution,
} from '../features/admin/types.js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone: string;
  photoUrl: string;
}

export interface ProfileUpdateInput {
  name: string;
  email: string;
  phone: string;
  photoUrl: string;
}

export interface ProProfileBasicInput {
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  photoUrl: string;
}

export interface ProPresentationInput {
  bio: string;
  socials: Professional['socials'];
  photos: string[];
}

export interface DataSource {
  /** Autentica por e-mail/senha e retorna o usuário logado. */
  signIn(email: string, password: string): Promise<AuthUser>;
  /** Encerra a sessão atual. */
  signOut(): Promise<void>;
  /** Retorna a sessão restaurada (ex.: ao recarregar a página), ou null se não houver. */
  getSession(): Promise<AuthUser | null>;

  /** Lista profissionais ativas visíveis para descoberta do cliente. */
  listProfessionals(): Promise<Professional[]>;
  /** Busca uma profissional pelo id, para a tela de perfil público. */
  getProfessional(id: string): Promise<Professional | null>;
  /** Ids de profissionais favoritadas pelo cliente. */
  listFavoriteIds(clientId: string): Promise<string[]>;
  /** Alterna o favorito e retorna a lista atualizada de ids. */
  toggleFavorite(clientId: string, professionalId: string): Promise<string[]>;

  /** Horários livres de um serviço numa data, já excluindo os agendamentos existentes. */
  getAvailableTimes(professionalId: string, date: string, serviceId: string): Promise<string[]>;
  /** Próximos dias com pelo menos um horário livre (para o serviço informado, ou qualquer serviço ativo). */
  getAvailableDays(professionalId: string, serviceId?: string | null): Promise<Array<[string, number]>>;

  /** Agendamentos do cliente logado. */
  listAppointments(clientId: string): Promise<AppointmentView[]>;
  /** Cria um agendamento; falha se o horário não estiver mais disponível. */
  createAppointment(clientId: string, input: CreateAppointmentInput): Promise<AppointmentView>;
  /** Cancela um agendamento do cliente. */
  cancelAppointment(clientId: string, appointmentId: string): Promise<AppointmentView>;
  /** Avalia um atendimento já realizado (nota de 0 a 5 e observação). */
  rateAppointment(clientId: string, appointmentId: string, rating: number, text: string): Promise<AppointmentView>;

  /** Atualiza nome, e-mail, telefone e foto do usuário logado. */
  updateProfile(userId: string, input: ProfileUpdateInput): Promise<AuthUser>;
  /** Registra a solicitação de exclusão de conta (LGPD); o processamento efetivo é feito pela API. */
  requestAccountDeletion(userId: string): Promise<void>;

  /** Profissional vinculada ao usuário logado (para as telas de agenda, serviços e perfil da profissional). */
  getMyProfessional(userId: string): Promise<Professional>;
  /** Agendamentos recebidos pela profissional logada. */
  listProAppointments(professionalId: string): Promise<ProAppointmentView[]>;
  /** Substitui os horários de disponibilidade de uma data (lista vazia remove a data). */
  setAvailabilitySlots(professionalId: string, date: string, slots: ProAvailabilitySlot[]): Promise<Professional>;
  /** Remove um único horário de disponibilidade de uma data. */
  removeAvailabilitySlot(professionalId: string, date: string, time: string): Promise<Professional>;

  /** Atualiza os dados básicos do perfil público da profissional. */
  updateMyProfessional(professionalId: string, input: ProProfileBasicInput): Promise<Professional>;
  /** Atualiza bio, redes sociais e fotos da apresentação profissional. */
  updatePresentation(professionalId: string, input: ProPresentationInput): Promise<Professional>;

  /** Cria ou atualiza um serviço do catálogo (informar `id` para editar). */
  saveService(professionalId: string, input: ProServiceInput, id?: string): Promise<Professional>;
  /** Ativa/desativa um serviço; serviços inativos não podem ser agendados. */
  toggleServiceActive(professionalId: string, serviceId: string): Promise<Professional>;
  /** Exclui um serviço do catálogo; agendamentos já feitos preservam o snapshot. */
  deleteService(professionalId: string, serviceId: string): Promise<Professional>;

  /** Anexa uma documentação profissional (PDF/PNG); apenas metadados são guardados no mock. */
  addDocument(professionalId: string, doc: Omit<ProDocument, 'id'>): Promise<Professional>;
  /** Remove uma documentação profissional. */
  removeDocument(professionalId: string, docId: string): Promise<Professional>;

  /** Salva os dados de recebimento (PIX e conta bancária). */
  savePayout(professionalId: string, pix: ProPixInfo, bank: ProBankInfo): Promise<Professional>;

  /** Despesas registradas pela profissional. */
  listExpenses(professionalId: string): Promise<Expense[]>;
  /** Registra uma nova despesa. */
  createExpense(professionalId: string, input: CreateExpenseInput): Promise<Expense>;

  /** Profissionais cadastradas na plataforma, para moderação do admin. */
  listAdminProfessionals(): Promise<AdminProfessional[]>;
  /** Aplica uma ação de moderação (aprovar, suspender, reativar, excluir, advertir, solicitar documentos). */
  adminProfessionalAction(id: string, action: AdminProfAction): Promise<AdminProfessional[]>;
  /** Clientes cadastrados na plataforma, para gestão do admin. */
  listAdminClients(): Promise<AdminClient[]>;
  /** Bloqueia/desbloqueia um cliente. */
  toggleAdminClientBlock(id: string): Promise<AdminClient[]>;
  /** Métricas financeiras da plataforma no período informado. */
  getAdminFinance(period: AdminFinancePeriod): Promise<AdminFinanceSnapshot>;
  /** Repasses pendentes/processados às profissionais. */
  listAdminPayouts(): Promise<AdminPayout[]>;
  /** Processa um repasse individual. */
  processAdminPayout(id: string): Promise<AdminPayout[]>;
  /** Processa todos os repasses pendentes. */
  processAllAdminPayouts(): Promise<AdminPayout[]>;
  /** Disputas de pagamento abertas. */
  listAdminDisputes(): Promise<AdminDispute[]>;
  /** Resolve uma disputa (reembolso ou manutenção do pagamento). */
  resolveAdminDispute(id: number, resolution: DisputeResolution): Promise<AdminDispute[]>;
  /** Configuração vigente da plataforma (taxas, verificação, manutenção). */
  getAdminConfig(): Promise<AdminConfig>;
  /** Salva as taxas e prazos da plataforma. */
  saveAdminConfig(rates: {
    commissionPct: number;
    depositMin: number;
    payoutDays: number;
    homeFee: number;
    lateFeePct: number;
  }): Promise<AdminConfig>;
  /** Ativa/desativa uma opção de verificação ou moderação de conteúdo. */
  toggleAdminConfigFlag(key: keyof AdminConfig['toggles']): Promise<AdminConfig>;
  /** Ativa/desativa o modo manutenção (bloqueia novos agendamentos). */
  toggleAdminMaintenance(): Promise<AdminConfig>;
}
