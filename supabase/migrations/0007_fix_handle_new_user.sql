-- O trigger em auth.users roda com o search_path do Auth (sem "public"), então o cast
-- ::user_role não era resolvido e o cadastro falhava com "Database error saving new user".
-- Fixa o search_path e qualifica o tipo.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'cliente')
  );
  return new;
end;
$$;
