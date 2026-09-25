-- ============================================================
-- Migração: fecha o escalonamento de privilégio no cadastro
-- Idempotente. Aplicar no SQL Editor do Supabase (dev primeiro).
-- ============================================================

-- 1) Todo cadastro novo é 'cliente'. O role vindo de raw_user_meta_data é
--    controlado pelo próprio usuário no signUp e NÃO pode ser confiável.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.email,
    'cliente'
  );
  return new;
end;
$$;

-- 2) Só admin (ou o SQL Editor / service role, onde auth.uid() é nulo)
--    altera o papel de um usuário.
create or replace function guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and coalesce(auth_role(), 'cliente') <> 'admin' then
    raise exception 'apenas administradores podem alterar o papel do usuário';
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_guard_role on profiles;
create trigger profiles_guard_role
  before update on profiles
  for each row execute function guard_profile_role();

-- 3) A profissional edita bio e dados, mas não se auto-aprova nem mexe em
--    status, nota, contagem de avaliações ou selo de verificação.
create or replace function guard_professional_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and coalesce(auth_role(), 'cliente') <> 'admin' and (
       new.status        is distinct from old.status
    or new.rating        is distinct from old.rating
    or new.reviews_count is distinct from old.reviews_count
    or new.verified_at   is distinct from old.verified_at) then
    raise exception 'apenas administradores podem alterar status, nota ou verificação';
  end if;
  return new;
end;
$$;
drop trigger if exists professional_profiles_guard on professional_profiles;
create trigger professional_profiles_guard
  before update on professional_profiles
  for each row execute function guard_professional_profile();

-- ── COMO PROMOVER ALGUÉM (só pelo SQL Editor, com service role) ──
--   update profiles set role = 'profissional' where email = 'fulana@exemplo.com';
--   update profiles set role = 'admin'        where email = 'voce@exemplo.com';

-- ── CONFERÊNCIA (deve retornar 'cliente' mesmo pedindo admin) ──
--   Cadastre um usuário de teste com options.data.role = 'admin' e rode:
--   select role from profiles where email = 'teste@exemplo.com';
