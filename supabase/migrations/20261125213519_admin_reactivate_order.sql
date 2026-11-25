-- Painel: admin reativa um pedido expirado ou cancelado (confere a vaga)

create or replace function public.admin_reactivate_order(
  p_order_id uuid,
  p_force boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order record;
  v_points integer;
  v_available integer;
  v_hold_hours integer;
  v_has_payment boolean;
  v_new_status public.order_status;
  v_expires timestamptz;
begin
  if not public.is_admin() then
    raise exception 'Acesso negado.';
  end if;

  select o.status, s.slot_time, s.active as slot_active,
         d.id as day_id, d.production_date, d.is_open
    into v_order
    from public.orders o
    join public.pickup_slots s on s.id = o.pickup_slot_id
    join public.production_days d on d.id = s.production_day_id
   where o.id = p_order_id
   for update of o;

  if not found then
    raise exception 'Pedido nao encontrado.';
  end if;

  if v_order.status not in ('expired', 'cancelled') then
    raise exception 'So da para reativar pedido expirado ou cancelado (status atual: %).', v_order.status;
  end if;

  if not v_order.is_open or not v_order.slot_active then
    raise exception 'O dia ou o horario esta fechado. Reabra antes de reativar.';
  end if;

  if (v_order.production_date + v_order.slot_time) at time zone 'America/Sao_Paulo' <= now() then
    raise exception 'A data de retirada desse pedido ja passou.';
  end if;

  select points into v_points
    from public.production_reservations
   where order_id = p_order_id
   order by created_at desc
   limit 1;

  if v_points is null then
    raise exception 'Reserva do pedido nao encontrada.';
  end if;

  perform 1 from public.production_days where id = v_order.day_id for update;

  v_available := public.day_available_points(v_order.day_id);

  if v_points > v_available and not p_force then
    raise exception 'Nao ha vaga: faltam % pontos neste dia. Para encaixar mesmo assim, confirme o encaixe.', v_points - v_available;
  end if;

  update public.production_reservations
     set status = 'active'
   where order_id = p_order_id and status = 'released';

  v_has_payment := exists (
    select 1 from public.payments
     where order_id = p_order_id and status = 'confirmed'
  );

  if v_has_payment then
    v_new_status := 'confirmed';
  else
    v_new_status := 'pending';
    select reservation_hold_hours into v_hold_hours from public.business_settings limit 1;
    v_expires := now() + make_interval(hours => v_hold_hours);
  end if;

  update public.orders
     set status = v_new_status,
         hold_expires_at = coalesce(v_expires, hold_expires_at),
         updated_at = now()
   where id = p_order_id;

  return jsonb_build_object(
    'order_id', p_order_id,
    'status', v_new_status,
    'hold_expires_at', v_expires,
    'over_capacity', v_points > v_available
  );
end;
$$;

revoke all on function public.admin_reactivate_order(uuid, boolean) from public, anon;
grant execute on function public.admin_reactivate_order(uuid, boolean) to authenticated;
