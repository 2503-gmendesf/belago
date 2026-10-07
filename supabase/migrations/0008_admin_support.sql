-- ============================================================
-- Suporte ao painel do admin: bloqueio de clientes, toggles de configuração
-- e fechamento de brechas de privilégio encontradas ao revisar o RLS.
-- ============================================================

-- Bloqueio de clientes (a API recusa novos agendamentos de quem está bloqueado).
alter table profiles add column blocked boolean not null default false;

-- Opções de verificação/moderação da tela de Configurações do admin.
alter table platform_config add column toggles jsonb not null
  default '{"verify":true,"identity":true,"certs":false,"reviews":true,"portfolio":false}'::jsonb;

-- handle_new_user confiava no "role" vindo dos metadados do cadastro. Como o signUp é público
-- (anon key), qualquer pessoa podia se cadastrar como admin. Só 'profissional' é aceito.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.email,
    case when new.raw_user_meta_data->>'role' = 'profissional'
      then 'profissional'::public.user_role
      else 'cliente'::public.user_role
    end
  );
  return new;
end;
$$;

-- profiles_update_own deixava o próprio usuário alterar qualquer coluna, inclusive role.
-- Só admin (ou código de servidor: service_role, funções security definer) muda role e blocked.
create or replace function public.protect_profile_columns() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') and coalesce(auth_role(), 'cliente') <> 'admin' then
    if new.role is distinct from old.role or new.blocked is distinct from old.blocked then
      raise exception 'Alteração não permitida' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_profile_protect
  before update on profiles
  for each row execute function protect_profile_columns();

-- Mesma ideia para professional_profiles: a profissional não pode se aprovar nem mudar a
-- própria nota. No insert, o perfil sempre nasce 'pendente'. rate_appointment (security
-- definer) continua atualizando rating/reviews_count normalmente.
create or replace function public.protect_professional_columns() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') and coalesce(auth_role(), 'cliente') <> 'admin' then
    if tg_op = 'INSERT' then
      new.status := 'pendente';
      new.rating := 0;
      new.reviews_count := 0;
      new.verified_at := null;
    elsif new.status is distinct from old.status
      or new.rating is distinct from old.rating
      or new.reviews_count is distinct from old.reviews_count
      or new.verified_at is distinct from old.verified_at then
      raise exception 'Alteração não permitida' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_prof_protect
  before insert or update on professional_profiles
  for each row execute function protect_professional_columns();

-- Bloqueia/desbloqueia uma cliente e devolve o novo estado. Só admin.
create or replace function public.admin_toggle_client_blocked(p_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_blocked boolean;
begin
  if coalesce(auth_role(), 'cliente') <> 'admin' then
    raise exception 'Acesso restrito à administração' using errcode = '42501';
  end if;
  update profiles set blocked = not blocked where id = p_id and role = 'cliente'
  returning blocked into v_blocked;
  if not found then
    raise exception 'Cliente não encontrada' using errcode = 'P0002';
  end if;
  return v_blocked;
end;
$$;
revoke execute on function public.admin_toggle_client_blocked(uuid) from public, anon;
grant execute on function public.admin_toggle_client_blocked(uuid) to authenticated;
