-- ============================================================
-- Fase 4, item 4: revisão das políticas RLS contra os fluxos reais
-- ============================================================

-- PROFESSIONAL_PROFILES não tinha política de insert: uma profissional recém
-- cadastrada nunca conseguiria criar o próprio perfil estendido.
create policy "prof_profiles_self_insert" on professional_profiles
  for insert with check (
    profile_id = auth.uid()
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'profissional')
  );

-- PROFESSIONAL_SERVICES não tinha política de delete: a dona do catálogo não
-- conseguia excluir um serviço pelo cliente Supabase direto.
create policy "services_owner_delete" on professional_services
  for delete using (professional_id = auth.uid());

-- APPT_PARTICIPANTS_UPDATE permitia que qualquer participante alterasse
-- qualquer coluna do agendamento (preço, horário, profissional...) contanto que
-- continuasse participante depois. Trocamos por um trigger que restringe:
-- só client_id/professional_id podem mudar status/cancel_reason, só para
-- 'cancelado', e só enquanto o agendamento ainda não foi concluído/cancelado.
-- Admin continua podendo alterar livremente (ex.: mediar disputa).
create or replace function enforce_appointment_update() returns trigger
language plpgsql as $$
begin
  if auth_role() = 'admin' then
    return new;
  end if;

  -- IS DISTINCT FROM (em vez de <>) porque service_id pode ser nulo depois que
  -- um serviço excluído solta a FK (ver migração 0004); <> com NULL nunca dá
  -- TRUE e deixaria essa coluna passar despercebida pela checagem.
  if new.client_id is distinct from old.client_id
    or new.professional_id is distinct from old.professional_id
    or new.service_id is distinct from old.service_id
    or new.service_name is distinct from old.service_name
    or new.category is distinct from old.category
    or new.duration_min is distinct from old.duration_min
    or new.price is distinct from old.price
    or new.home_fee is distinct from old.home_fee
    or new.scheduled_date is distinct from old.scheduled_date
    or new.scheduled_time is distinct from old.scheduled_time
    or new.location is distinct from old.location then
    raise exception 'Apenas status e motivo de cancelamento podem ser alterados por um participante';
  end if;

  if new.status = old.status then
    return new;
  end if;

  if new.status <> 'cancelado' then
    raise exception 'Transição de status não permitida por um participante';
  end if;

  if old.status not in ('pendente', 'confirmado') then
    raise exception 'Agendamento não pode mais ser cancelado';
  end if;

  return new;
end;
$$;

create trigger trg_appt_update
  before update on appointments
  for each row execute function enforce_appointment_update();
