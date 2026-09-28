-- ============================================================
-- Fase 4: ajustes descobertos ao implementar o DataSource do Supabase
-- ============================================================

-- Agendamentos já guardam snapshot completo do serviço (migração 0002), então
-- excluir o serviço não precisa mais falhar por FK: o histórico continua legível
-- mesmo com service_id nulo.
alter table appointments alter column service_id drop not null;
alter table appointments drop constraint appointments_service_id_fkey;
alter table appointments
  add constraint appointments_service_id_fkey
  foreign key (service_id) references professional_services(id) on delete set null;

-- Avaliar um atendimento atualiza o rating/reviews_count agregados da
-- profissional (professional_profiles), mas a cliente não tem (e não deve ter)
-- permissão de update nessa tabela. Função SECURITY DEFINER valida que quem
-- chama é a própria cliente do agendamento e faz a inserção + atualização
-- agregada de forma atômica.
create or replace function rate_appointment(p_appointment_id uuid, p_rating smallint, p_comment text)
returns void language plpgsql security definer as $$
declare
  v_client_id uuid;
  v_professional_id uuid;
begin
  select client_id, professional_id into v_client_id, v_professional_id
  from appointments where id = p_appointment_id;

  if v_client_id is null then
    raise exception 'Agendamento não encontrado';
  end if;
  if v_client_id <> auth.uid() then
    raise exception 'Apenas a cliente do agendamento pode avaliá-lo';
  end if;
  if p_rating < 1 or p_rating > 5 then
    raise exception 'Nota deve ser entre 1 e 5';
  end if;

  insert into reviews (appointment_id, client_id, professional_id, rating, comment)
  values (p_appointment_id, v_client_id, v_professional_id, p_rating, p_comment);

  update professional_profiles
  set rating = round(((rating * reviews_count) + p_rating) / (reviews_count + 1), 1),
      reviews_count = reviews_count + 1
  where profile_id = v_professional_id;
end;
$$;
