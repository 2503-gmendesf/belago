-- auth_role() lia profiles com o RLS do chamador, e a política de profiles chama auth_role():
-- recursão infinita ("stack depth limit exceeded") assim que a consulta varre mais de uma linha
-- (ex.: o admin listando clientes). Com security definer a leitura ignora o RLS; a função só
-- devolve o papel do próprio usuário (auth.uid()), então não expõe dado de ninguém.
create or replace function public.auth_role() returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;
