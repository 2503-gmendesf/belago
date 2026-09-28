-- ============================================================
-- Fase 5: suporte à API (criação de agendamento e repasses no servidor)
-- ============================================================

-- Agendamentos passam a ser criados só pela API (service_role), que valida
-- disponibilidade, calcula preço/taxa/comissão e grava o snapshot do serviço.
-- Sem esta política, um cliente com a anon key poderia inserir direto pelo
-- Supabase um agendamento com preço arbitrário ou em horário já ocupado.
drop policy if exists "appt_client_insert" on appointments;

-- Rede de segurança contra corrida: duas requisições simultâneas para o mesmo
-- horário passariam ambas pela checagem da API. O lock por profissional+data
-- serializa os inserts e o trigger rejeita a sobreposição de intervalos.
create or replace function enforce_no_appointment_overlap() returns trigger
language plpgsql as $$
begin
  if new.status = 'cancelado' then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.professional_id::text || new.scheduled_date::text, 0));

  if exists (
    select 1 from appointments a
    where a.professional_id = new.professional_id
      and a.scheduled_date = new.scheduled_date
      and a.status <> 'cancelado'
      and a.id <> new.id
      and new.scheduled_time < a.scheduled_time + make_interval(mins => a.duration_min)
      and new.scheduled_time + make_interval(mins => new.duration_min) > a.scheduled_time
  ) then
    raise exception 'Horário indisponível' using errcode = '23P01';
  end if;

  return new;
end;
$$;

create trigger trg_appt_no_overlap
  before insert on appointments
  for each row execute function enforce_no_appointment_overlap();

-- Vincula cada pagamento ao repasse que o quitou, para não repassar duas vezes.
alter table payments add column payout_id uuid references payouts(id);
create index idx_payments_payout on payments(payout_id);

-- Conciliação de webhook: id da transação no provedor de pagamento (idempotência).
alter table payments add column provider_ref text unique;

-- Cria um repasse somando, de forma atômica, os pagamentos ainda não repassados de uma
-- profissional no período. Só a API (service_role) pode chamar.
create or replace function create_payout(p_professional_id uuid, p_period_start date, p_period_end date)
returns payouts language plpgsql security definer set search_path = public as $$
declare
  v_total numeric(10,2);
  v_payout payouts;
begin
  select coalesce(sum(p.net_amount), 0) into v_total
  from payments p
  join appointments a on a.id = p.appointment_id
  where a.professional_id = p_professional_id
    and a.status <> 'cancelado'
    and p.payout_id is null
    and p.paid_at >= p_period_start
    and p.paid_at < (p_period_end + 1);

  if v_total <= 0 then
    raise exception 'Nenhum pagamento a repassar no período' using errcode = 'P0002';
  end if;

  insert into payouts (professional_id, amount, period_start, period_end)
  values (p_professional_id, v_total, p_period_start, p_period_end)
  returning * into v_payout;

  update payments p set payout_id = v_payout.id
  from appointments a
  where a.id = p.appointment_id
    and a.professional_id = p_professional_id
    and a.status <> 'cancelado'
    and p.payout_id is null
    and p.paid_at >= p_period_start
    and p.paid_at < (p_period_end + 1);

  return v_payout;
end;
$$;
revoke execute on function create_payout(uuid, date, date) from public, anon, authenticated;
grant execute on function create_payout(uuid, date, date) to service_role;
