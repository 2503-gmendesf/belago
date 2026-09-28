-- ============================================================
-- Fase 4: colunas que faltavam para a integração real do front
-- ============================================================

-- APPOINTMENTS: faltava o snapshot do serviço (nome, categoria, duração) —
-- CLAUDE.md exige que alterar/excluir o serviço depois não mude agendamentos já feitos,
-- mas só havia uma FK viva para professional_services.
alter table appointments
  add column service_name text not null default '',
  add column category text not null default '',
  add column duration_min int not null default 0;
alter table appointments alter column service_name drop default;
alter table appointments alter column category drop default;
alter table appointments alter column duration_min drop default;

-- PROFESSIONAL_SERVICES: faltava a especialidade do serviço (ProService.category
-- em apps/web/src/features/discovery/types.ts) — usada para filtro de busca e
-- para o snapshot salvo em appointments.category.
alter table professional_services
  add column category text not null default '';
alter table professional_services alter column category drop default;

-- PROFESSIONAL_PROFILES: campos do perfil público que a tela de descoberta e o
-- perfil da profissional (apps/web/src/features/discovery/types.ts) precisam e
-- que não tinham coluna own.
alter table professional_profiles
  add column city text,
  add column address text,
  add column attends_home boolean not null default false,
  add column photos jsonb not null default '[]',
  add column socials jsonb not null default '{}',
  add column pix_type text,
  add column bank_info jsonb;

-- AVAILABILITY_SLOTS: um horário pode valer para todos os serviços ativos
-- (all_services) ou só para alguns — precisa de uma tabela de junção.
alter table availability_slots
  add column all_services boolean not null default true;

create table availability_slot_services (
  slot_id uuid not null references availability_slots(id) on delete cascade,
  service_id uuid not null references professional_services(id) on delete cascade,
  primary key (slot_id, service_id)
);

-- PROFESSIONAL_DOCUMENTS: documentação enviada para verificação (só metadados;
-- upload de arquivo fica fora do escopo da Fase 4).
create table professional_documents (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references professional_profiles(profile_id) on delete cascade,
  name text not null,
  size int not null,
  type text not null,
  created_at timestamptz not null default now()
);

alter table availability_slot_services enable row level security;
alter table professional_documents enable row level security;

create policy "avail_slot_services_public_read" on availability_slot_services
  for select using (true);
create policy "avail_slot_services_owner_write" on availability_slot_services
  for insert with check (
    exists (
      select 1 from availability_slots s
      where s.id = slot_id and s.professional_id = auth.uid()
    )
  );
create policy "avail_slot_services_owner_delete" on availability_slot_services
  for delete using (
    exists (
      select 1 from availability_slots s
      where s.id = slot_id and s.professional_id = auth.uid()
    )
  );

create policy "documents_owner_all" on professional_documents
  for all using (professional_id = auth.uid() or auth_role() = 'admin');
