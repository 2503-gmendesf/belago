-- cities ficou sem RLS na 0001: com a chave anon (pública) qualquer um poderia alterar a tabela.
-- Leitura pública; escrita só via service_role (que ignora o RLS).
alter table cities enable row level security;

create policy "cities_public_read" on cities for select using (true);
