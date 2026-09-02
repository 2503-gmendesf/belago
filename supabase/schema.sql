-- ============================================================
-- BelaGo — Schema Supabase / Postgres
-- ============================================================
-- Convenção: auth.users (Supabase Auth) é a fonte de identidade.
-- profiles.id = auth.users.id (1:1). O papel (role) mora em profiles.

-- ── EXTENSÕES ──
create extension if not exists "pgcrypto";

-- ── ENUMS ──
create type user_role as enum ('cliente','profissional','admin');
create type prof_status as enum ('pendente','ativa','suspensa','excluida');
create type appt_status as enum ('pendente','confirmado','cancelado','realizado','disputa');
create type appt_location as enum ('estudio','domicilio');
create type payment_method as enum ('pix','cartao','dinheiro');
create type payout_status as enum ('pendente','processado');

-- ── PROFILES (1:1 com auth.users) ──
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'cliente',
  name text not null,
  email text not null,
  phone text,
  avatar_url text,
  gender text,
  birth_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── CIDADES / ZONAS ATIVAS ──
create table cities (
  id serial primary key,
  name text not null unique,
  state text not null,
  active boolean not null default true
);

-- ── PERFIL DE PROFISSIONAL (dados extras, 1:1 com profiles quando role=profissional) ──
create table professional_profiles (
  profile_id uuid primary key references profiles(id) on delete cascade,
  specialty text not null,
  bio text,
  city_id int references cities(id),
  status prof_status not null default 'pendente',
  rating numeric(2,1) not null default 0,
  reviews_count int not null default 0,
  pix_key text,
  online boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

-- ── SERVIÇOS OFERECIDOS POR CADA PROFISSIONAL ──
create table professional_services (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references professional_profiles(profile_id) on delete cascade,
  name text not null,
  price numeric(10,2) not null,
  duration_min int not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── DISPONIBILIDADE (datas/horários abertos por profissional) ──
create table availability_slots (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references professional_profiles(profile_id) on delete cascade,
  date date not null,
  time time not null,
  is_booked boolean not null default false,
  unique(professional_id, date, time)
);

-- ── ENDEREÇOS SALVOS (clientes) ──
create table addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  label text not null,             -- "Casa", "Trabalho"
  street text not null,
  neighborhood text,
  city text,
  state text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── AGENDAMENTOS ──
create table appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id),
  professional_id uuid not null references professional_profiles(profile_id),
  service_id uuid not null references professional_services(id),
  slot_id uuid references availability_slots(id),
  scheduled_date date not null,
  scheduled_time time not null,
  location appt_location not null default 'estudio',
  address_id uuid references addresses(id),
  price numeric(10,2) not null,
  home_fee numeric(10,2) not null default 0,
  status appt_status not null default 'pendente',
  payment_method payment_method,
  deposit_paid boolean not null default false,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_appt_client on appointments(client_id);
create index idx_appt_prof on appointments(professional_id);
create index idx_appt_status on appointments(status);

-- ── AVALIAÇÕES ──
create table reviews (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id) unique,
  client_id uuid not null references profiles(id),
  professional_id uuid not null references professional_profiles(profile_id),
  rating smallint not null check (rating between 1 and 5),
  comment text,
  reported boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── PAGAMENTOS / TRANSAÇÕES ──
create table payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id) unique,
  amount numeric(10,2) not null,
  platform_fee numeric(10,2) not null,
  net_amount numeric(10,2) not null,
  method payment_method not null,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- ── DESPESAS DA PROFISSIONAL ──
create table expenses (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references professional_profiles(profile_id) on delete cascade,
  description text not null,
  amount numeric(10,2) not null,
  category text not null,
  created_at timestamptz not null default now()
);

-- ── REPASSES (PAYOUTS) ──
create table payouts (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references professional_profiles(profile_id),
  amount numeric(10,2) not null,
  status payout_status not null default 'pendente',
  period_start date not null,
  period_end date not null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ── DISPUTAS ──
create table disputes (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id),
  opened_by uuid not null references profiles(id),
  reason text not null,
  status text not null default 'aberta', -- aberta | resolvida | rejeitada
  resolution text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- ── CONFIGURAÇÕES DA PLATAFORMA (singleton) ──
create table platform_config (
  id int primary key default 1,
  commission_pct numeric(5,2) not null default 15,
  min_deposit numeric(10,2) not null default 15,
  payout_days int not null default 7,
  home_fee numeric(10,2) not null default 20,
  late_cancel_penalty_pct numeric(5,2) not null default 30,
  maintenance_mode boolean not null default false,
  check (id = 1)
);
insert into platform_config (id) values (1);

-- ── NOTIFICAÇÕES ──
create table notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  icon text,
  title text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── FAVORITOS ──
create table favorites (
  client_id uuid not null references profiles(id) on delete cascade,
  professional_id uuid not null references professional_profiles(profile_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, professional_id)
);

-- ── SOLICITAÇÕES DE EXCLUSÃO DE CONTA (LGPD / Apple 5.1.1(v) / Play Data Safety) ──
-- O app não usa a service role key no cliente (por segurança), então a exclusão
-- não é instantânea: o usuário registra o pedido aqui, sinaliza no console (ou via
-- Edge Function agendada, ver Fluxos-de-Usuario-e-Roadmap-Publicacao.md) processa a
-- exclusão definitiva (auth.admin.deleteUser + cascade) em até 7 dias.
create table account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references profiles(id)
);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
alter table profiles enable row level security;
alter table professional_profiles enable row level security;
alter table professional_services enable row level security;
alter table availability_slots enable row level security;
alter table addresses enable row level security;
alter table appointments enable row level security;
alter table reviews enable row level security;
alter table payments enable row level security;
alter table expenses enable row level security;
alter table payouts enable row level security;
alter table disputes enable row level security;
alter table notifications enable row level security;
alter table favorites enable row level security;
alter table account_deletion_requests enable row level security;

-- Helper: papel do usuário logado
create or replace function auth_role() returns user_role
language sql stable as $$
  select role from profiles where id = auth.uid();
$$;

-- PROFILES: usuário vê/edita o próprio; admin vê todos
create policy "profiles_select_own_or_admin" on profiles
  for select using (id = auth.uid() or auth_role() = 'admin');
create policy "profiles_update_own" on profiles
  for update using (id = auth.uid());

-- PROFESSIONAL_PROFILES: público pode ver ativas; a própria profissional e admin veem tudo
create policy "prof_profiles_public_read" on professional_profiles
  for select using (status = 'ativa' or profile_id = auth.uid() or auth_role() = 'admin');
create policy "prof_profiles_self_update" on professional_profiles
  for update using (profile_id = auth.uid() or auth_role() = 'admin');

-- SERVICES: público lê serviços ativos; dona do perfil gerencia
create policy "services_public_read" on professional_services
  for select using (true);
create policy "services_owner_write" on professional_services
  for insert with check (professional_id = auth.uid());
create policy "services_owner_update" on professional_services
  for update using (professional_id = auth.uid() or auth_role() = 'admin');

-- AVAILABILITY: público lê; dona gerencia
create policy "avail_public_read" on availability_slots for select using (true);
create policy "avail_owner_write" on availability_slots
  for insert with check (professional_id = auth.uid());
create policy "avail_owner_update" on availability_slots
  for update using (professional_id = auth.uid());
create policy "avail_owner_delete" on availability_slots
  for delete using (professional_id = auth.uid());

-- ADDRESSES: só o dono
create policy "addresses_owner_all" on addresses
  for all using (profile_id = auth.uid());

-- APPOINTMENTS: cliente ou profissional envolvidos, ou admin
create policy "appt_participants_read" on appointments
  for select using (client_id = auth.uid() or professional_id = auth.uid() or auth_role() = 'admin');
create policy "appt_client_insert" on appointments
  for insert with check (client_id = auth.uid());
create policy "appt_participants_update" on appointments
  for update using (client_id = auth.uid() or professional_id = auth.uid() or auth_role() = 'admin');

-- REVIEWS: cliente cria a sua; todos leem; admin modera
create policy "reviews_public_read" on reviews for select using (true);
create policy "reviews_client_insert" on reviews
  for insert with check (client_id = auth.uid());
create policy "reviews_admin_moderate" on reviews
  for update using (auth_role() = 'admin');

-- PAYMENTS: participantes do agendamento + admin
create policy "payments_read" on payments for select using (
  auth_role() = 'admin' or exists (
    select 1 from appointments a where a.id = appointment_id
    and (a.client_id = auth.uid() or a.professional_id = auth.uid())
  )
);

-- EXPENSES: só a própria profissional
create policy "expenses_owner_all" on expenses
  for all using (professional_id = auth.uid());

-- PAYOUTS: profissional vê os seus; admin gerencia tudo
create policy "payouts_read" on payouts
  for select using (professional_id = auth.uid() or auth_role() = 'admin');
create policy "payouts_admin_write" on payouts
  for all using (auth_role() = 'admin');

-- DISPUTES: quem abriu, a outra parte do agendamento, e admin
create policy "disputes_participants_read" on disputes
  for select using (
    opened_by = auth.uid() or auth_role() = 'admin' or exists (
      select 1 from appointments a where a.id = appointment_id
      and (a.client_id = auth.uid() or a.professional_id = auth.uid())
    )
  );
create policy "disputes_insert" on disputes
  for insert with check (opened_by = auth.uid());
create policy "disputes_admin_resolve" on disputes
  for update using (auth_role() = 'admin');

-- NOTIFICATIONS: só o dono
create policy "notif_owner_all" on notifications
  for all using (profile_id = auth.uid());

-- FAVORITES: só o dono
create policy "favorites_owner_all" on favorites
  for all using (client_id = auth.uid());

-- ACCOUNT_DELETION_REQUESTS: usuário registra o próprio pedido e o lê; admin lê/processa tudo
create policy "deletion_req_owner_insert" on account_deletion_requests
  for insert with check (profile_id = auth.uid());
create policy "deletion_req_owner_read" on account_deletion_requests
  for select using (profile_id = auth.uid() or auth_role() = 'admin');
create policy "deletion_req_admin_update" on account_deletion_requests
  for update using (auth_role() = 'admin');

-- PLATFORM_CONFIG: leitura pública, escrita só admin
alter table platform_config enable row level security;
create policy "config_public_read" on platform_config for select using (true);
create policy "config_admin_write" on platform_config
  for update using (auth_role() = 'admin');

-- ============================================================
-- TRIGGER: criar profile automaticamente ao registrar usuário
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'cliente')
  );
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
