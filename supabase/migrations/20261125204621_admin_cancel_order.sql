-- Painel: admin cancela ou recusa um pedido e libera a vaga

create or replace function public.admin_cancel_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order record;
  v_points integer;
begin
  if not public.is_admin() then
    raise exception 'Acesso negado.';
  end if;

  select id, status
    into v_order
    from public.orders
   where id = p_order_id
   for update;

  if not found then
    raise exception 'Pedido nao encontrado.';
  end if;

  if v_order.status not in ('pending', 'confirmed') then
    raise exception 'Esse pedido nao pode ser cancelado (status atual: %).', v_order.status;
  end if;

  update public.orders
     set status = 'cancelled', updated_at = now()
   where id = p_order_id;

  update public.production_reservations
     set status = 'released'
   where order_id = p_order_id and status = 'active'
  returning points into v_points;

  return jsonb_build_object(
    'order_id', p_order_id,
    'status', 'cancelled',
    'released_points', coalesce(v_points, 0)
  );
end;
$$;

revoke all on function public.admin_cancel_order(uuid) from public, anon;
grant execute on function public.admin_cancel_order(uuid) to authenticated;
