-- ============================================================
-- Segurança: dados de recebimento privados + colunas financeiras do agendamento protegidas
-- ============================================================

-- 1) PIX e dados bancários estavam em professional_profiles, cuja leitura é pública
--    (profissionais 'ativa'). Passam para uma tabela só do dono e do admin.
create table professional_payout_info (
  professional_id uuid primary key references professional_profiles(profile_id) on delete cascade,
  pix_key text,
  pix_type text,
  bank_info jsonb,
  updated_at timestamptz not null default now()
);

insert into professional_payout_info (professional_id, pix_key, pix_type, bank_info)
select profile_id, pix_key, pix_type, bank_info
from professional_profiles
where pix_key is not null or pix_type is not null or bank_info is not null;

alter table professional_payout_info enable row level security;

create policy "payout_info_owner_or_admin" on professional_payout_info
  for all
  using (professional_id = auth.uid() or auth_role() = 'admin')
  with check (professional_id = auth.uid() or auth_role() = 'admin');

alter table professional_profiles
  drop column pix_key,
  drop column pix_type,
  drop column bank_info;

-- 2) O trigger de update de agendamentos não protegia payment_method, deposit_paid, slot_id
--    e address_id: uma cliente podia marcar o sinal como pago. Agora só admin e código de
--    servidor (service_role: webhook, API) mexem nelas. Além disso, o trigger só restringe
--    chamadas vindas de usuárias (authenticated/anon); o service_role passa livre, o que também
--    permite ao webhook de pagamento mudar o status para 'confirmado'.
create or replace function enforce_appointment_update() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;
  if coalesce(auth_role(), 'cliente') = 'admin' then
    return new;
  end if;

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
    or new.location is distinct from old.location
    or new.slot_id is distinct from old.slot_id
    or new.address_id is distinct from old.address_id
    or new.payment_method is distinct from old.payment_method
    or new.deposit_paid is distinct from old.deposit_paid then
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
