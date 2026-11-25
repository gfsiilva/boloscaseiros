create or replace function public.admin_list_orders(
  p_statuses public.order_status[] default null,
  p_from date default null,
  p_to date default null,
  p_limit integer default 100
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 100), 1), 200);
begin
  if not (select public.is_admin()) then
    raise exception 'Acesso negado.';
  end if;

  return coalesce((
    select jsonb_agg(x.row_json order by x.pickup_at, x.created_at)
    from (
      select
        o.created_at,
        (d.production_date + s.slot_time) as pickup_at,
        jsonb_build_object(
          'order_id', o.id,
          'status', o.status,
          'customer_name', c.name,
          'customer_phone', c.phone,
          'pickup_date', d.production_date,
          'pickup_time', s.slot_time,
          'notes', o.notes,
          'created_at', o.created_at,
          'hold_expires_at', o.hold_expires_at,
          'original_total_cents', o.total_cents - adj.adjusted,
          'total_cents', o.total_cents,
          'paid_cents', pay.paid,
          'remaining_cents', o.total_cents - pay.paid,
          'items', (
            select coalesce(jsonb_agg(jsonb_build_object(
              'product_name', oi.product_name,
              'flavor_name', oi.flavor_name,
              'unit_price_cents', oi.unit_price_cents,
              'quantity', oi.quantity
            ) order by oi.created_at, oi.product_name), '[]'::jsonb)
            from public.order_items oi
            where oi.order_id = o.id
          ),
          'adjustments', (
            select coalesce(jsonb_agg(jsonb_build_object(
              'amount_cents', a.amount_cents,
              'reason', a.reason,
              'created_at', a.created_at
            ) order by a.created_at), '[]'::jsonb)
            from public.order_adjustments a
            where a.order_id = o.id
          )
        ) as row_json
      from public.orders o
      join public.customers c on c.id = o.customer_id
      join public.pickup_slots s on s.id = o.pickup_slot_id
      join public.production_days d on d.id = s.production_day_id
      cross join lateral (
        select coalesce(sum(p.amount_cents), 0)::integer as paid
          from public.payments p
         where p.order_id = o.id and p.status = 'confirmed'
      ) pay
      cross join lateral (
        select coalesce(sum(a2.amount_cents), 0)::integer as adjusted
          from public.order_adjustments a2
         where a2.order_id = o.id
      ) adj
      where (p_statuses is null or o.status = any(p_statuses))
        and (p_from is null or d.production_date >= p_from)
        and (p_to is null or d.production_date <= p_to)
      order by (d.production_date + s.slot_time), o.created_at
      limit v_limit
    ) x
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.admin_list_orders(public.order_status[], date, date, integer) from public, anon;
grant execute on function public.admin_list_orders(public.order_status[], date, date, integer) to authenticated;
