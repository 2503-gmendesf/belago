-- ============================================================
-- BelaGo — seed de desenvolvimento
-- ============================================================
-- Reproduz em Supabase local (`supabase start` + `supabase db reset`) o mesmo
-- comportamento do DataSource mock: as 3 contas demo (senha "123456" nas duas
-- primeiras) e as 6 profissionais de apps/web/src/features/discovery/fixtures.ts,
-- para que o modo Supabase não pareça "vazio" em dev.
--
-- Só roda em ambiente local/dev, nunca em produção (usa auth.users diretamente).

-- ── Helper: cria um usuário de auth + profile (via trigger) e devolve o id ──
create or replace function _seed_user(p_email text, p_name text, p_role user_role, p_password text)
returns uuid language plpgsql as $$
declare
  v_id uuid := gen_random_uuid();
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    p_email, crypt(p_password, gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}',
    jsonb_build_object('name', p_name, 'role', p_role),
    now(), now(), '', ''
  );
  insert into auth.identities (
    id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_id, v_id,
    jsonb_build_object('sub', v_id::text, 'email', p_email),
    'email', now(), now(), now()
  );
  return v_id;
end;
$$;

-- ── Contas demo (login) ──
select _seed_user('cliente@belago.app', 'Juliana Souza', 'cliente', '123456');
select _seed_user('admin@belago.app', 'Admin BelaGo', 'admin', '123456');

-- ── Profissionais (fixtures de apps/web/src/features/discovery/fixtures.ts) ──
-- A primeira (Fernanda Costa) é a conta demo "profissional@belago.app" (senha 123456);
-- as demais só existem para popular a descoberta do cliente, sem login demo próprio.
create or replace function _seed_professional(
  p_email text, p_name text, p_password text, p_specialty text, p_city text, p_address text,
  p_attends_home boolean, p_bio text, p_instagram text, p_rating numeric, p_reviews_count int,
  p_services jsonb -- [{name, category, duration_min, price, active}]
) returns uuid language plpgsql as $$
declare
  v_id uuid;
  v_svc jsonb;
  v_service_id uuid;
  v_day int;
  v_time text;
  v_slot_id uuid;
begin
  v_id := _seed_user(p_email, p_name, 'profissional', p_password);

  insert into professional_profiles (
    profile_id, specialty, bio, status, rating, reviews_count,
    city, address, attends_home, socials, online
  ) values (
    v_id, p_specialty, p_bio, 'ativa', p_rating, p_reviews_count,
    p_city, p_address, p_attends_home, jsonb_build_object('instagram', p_instagram), true
  );

  for v_svc in select * from jsonb_array_elements(p_services) loop
    insert into professional_services (professional_id, name, price, duration_min, active)
    values (
      v_id, v_svc->>'name', (v_svc->>'price')::numeric, (v_svc->>'duration_min')::int,
      coalesce((v_svc->>'active')::boolean, true)
    );
  end loop;

  -- disponibilidade: próximos 10 dias, horários fixos, aberta para todos os serviços ativos
  for v_day in 0..9 loop
    for v_time in select unnest(array['09:00','10:30','13:00','14:00','15:30','17:00']) loop
      insert into availability_slots (professional_id, date, time, all_services)
      values (v_id, current_date + v_day, v_time::time, true);
    end loop;
  end loop;

  return v_id;
end;
$$;

select _seed_professional(
  'profissional@belago.app', 'Fernanda Costa', '123456',
  'sobrancelha', 'Betim, MG', 'Rua das Flores, 142 — Betim, MG', true,
  'Especialista em design de sobrancelha e extensão de cílios, com 8 anos de experiência.',
  '@fernandacosta.brows', 4.9, 147,
  '[
    {"name":"Design de Sobrancelha","category":"sobrancelha","duration_min":45,"price":45},
    {"name":"Henna de Sobrancelha","category":"sobrancelha","duration_min":60,"price":60},
    {"name":"Volume Russo","category":"cilios","duration_min":120,"price":180},
    {"name":"Fio a Fio","category":"cilios","duration_min":90,"price":150,"active":false}
  ]'::jsonb
);

select _seed_professional(
  'bruna.oliveira@belago.demo', 'Bruna Oliveira', 'demo-only',
  'maquiagem', 'Contagem, MG', 'Av. João César de Oliveira, 500 — Contagem, MG', true,
  'Maquiadora profissional. Especializada em noivas, festas e eventos.',
  '@brunamakeoficial', 4.8, 89,
  '[
    {"name":"Maquiagem Social","category":"maquiagem","duration_min":60,"price":120},
    {"name":"Maquiagem para Noiva","category":"maquiagem","duration_min":120,"price":350},
    {"name":"Maquiagem Natural","category":"maquiagem","duration_min":45,"price":90}
  ]'::jsonb
);

select _seed_professional(
  'camila.santos@belago.demo', 'Camila Santos', 'demo-only',
  'cabelo', 'Belo Horizonte, MG', 'Rua da Bahia, 1200 — Belo Horizonte, MG', false,
  'Cabeleireira com 10 anos de experiência em coloração, cortes e escova.',
  '@camilasantoshair', 5.0, 213,
  '[
    {"name":"Escova Simples","category":"cabelo","duration_min":45,"price":60},
    {"name":"Escova Progressiva","category":"cabelo","duration_min":150,"price":180},
    {"name":"Coloração","category":"cabelo","duration_min":180,"price":220},
    {"name":"Corte Feminino","category":"cabelo","duration_min":60,"price":80},
    {"name":"Penteado Social","category":"penteado","duration_min":60,"price":120}
  ]'::jsonb
);

select _seed_professional(
  'taina.ferreira@belago.demo', 'Tainá Ferreira', 'demo-only',
  'unhas', 'Belo Horizonte, MG', 'Rua Sergipe, 890 — Belo Horizonte, MG', true,
  'Nail designer especializada em nail art, gel e fibra de vidro.',
  '@tainanails', 4.7, 76,
  '[
    {"name":"Manicure Simples","category":"unhas","duration_min":40,"price":35},
    {"name":"Pedicure Completa","category":"unhas","duration_min":50,"price":45},
    {"name":"Unhas em Gel","category":"unhas","duration_min":90,"price":120}
  ]'::jsonb
);

select _seed_professional(
  'leticia.moura@belago.demo', 'Letícia Moura', 'demo-only',
  'penteado', 'Sabará, MG', 'Rua Comendador Viana, 77 — Sabará, MG', false,
  'Penteadeira especializada em casamentos e formaturas.',
  '@leticiamoura.hair', 4.9, 54,
  '[
    {"name":"Penteado Social","category":"penteado","duration_min":60,"price":150},
    {"name":"Penteado para Noiva","category":"penteado","duration_min":120,"price":400},
    {"name":"Coque Moderno","category":"penteado","duration_min":40,"price":110}
  ]'::jsonb
);

select _seed_professional(
  'priscila.ramos@belago.demo', 'Priscila Ramos', 'demo-only',
  'micropigmentacao', 'Contagem, MG', 'Rua Padre Pedro Pinto, 300 — Contagem, MG', false,
  'Micropigmentadora certificada. Sobrancelha, olhos e lábios.',
  '@priscilamicro', 4.8, 38,
  '[
    {"name":"Micropigmentação de Sobrancelha","category":"micropigmentacao","duration_min":180,"price":500},
    {"name":"Micropigmentação Labial","category":"micropigmentacao","duration_min":180,"price":600},
    {"name":"Retoque","category":"micropigmentacao","duration_min":90,"price":200},
    {"name":"Depilação com Cera","category":"depilacao","duration_min":40,"price":50}
  ]'::jsonb
);

-- ── Favoritos da cliente demo (paridade com DEFAULT_FAVORITE_IDS do mock) ──
insert into favorites (client_id, professional_id)
select
  (select id from profiles where email = 'cliente@belago.app'),
  (select profile_id from professional_profiles pp join profiles p on p.id = pp.profile_id where p.email = e)
from unnest(array['profissional@belago.app', 'camila.santos@belago.demo']) as e;

-- ── Agendamentos de exemplo (paridade com appointmentsStore seed) ──
do $$
declare
  v_client uuid := (select id from profiles where email = 'cliente@belago.app');
  v_fernanda uuid := (select id from profiles where email = 'profissional@belago.app');
  v_taina uuid := (select id from profiles where email = 'taina.ferreira@belago.demo');
  v_svc_id uuid;
  v_appt_id uuid;
begin
  -- próximo: Design de Sobrancelha com a Fernanda, daqui a 1 dia
  select id into v_svc_id from professional_services where professional_id = v_fernanda and name = 'Design de Sobrancelha';
  insert into appointments (
    client_id, professional_id, service_id, service_name, category, duration_min,
    scheduled_date, scheduled_time, location, price, home_fee, status
  ) values (
    v_client, v_fernanda, v_svc_id, 'Design de Sobrancelha', 'sobrancelha', 45,
    current_date + 1, '14:00', 'estudio', 45, 0, 'confirmado'
  );

  -- passado: Manicure Simples com a Tainá, já avaliado
  select id into v_svc_id from professional_services where professional_id = v_taina and name = 'Manicure Simples';
  insert into appointments (
    client_id, professional_id, service_id, service_name, category, duration_min,
    scheduled_date, scheduled_time, location, price, home_fee, status
  ) values (
    v_client, v_taina, v_svc_id, 'Manicure Simples', 'unhas', 40,
    current_date - 13, '11:00', 'estudio', 35, 0, 'confirmado'
  ) returning id into v_appt_id;

  insert into reviews (appointment_id, client_id, professional_id, rating, comment)
  values (v_appt_id, v_client, v_taina, 5, 'Unhas perfeitas.');
end;
$$;

drop function _seed_professional(text, text, text, text, text, text, boolean, text, text, numeric, int, jsonb);
drop function _seed_user(text, text, user_role, text);
