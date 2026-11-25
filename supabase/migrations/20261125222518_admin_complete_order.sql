-- Painel: admin conclui o pedido quando o cliente retira o bolo

create or replace function public.admin_complete_order(
  p_order_id uuid,
  p_balance_received boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order record;
  v_paid integer;
  v_remaining integer;
begin
  if not public.is_admin() then
    raise exception 'Acesso negado.';
  end if;

  select id, status, total_cents
    into v_order
    from public.orders
   where id = p_order_id
   for update;

  if not found then
    raise exception 'Pedido nao encontrado.';
  end if;

  if v_order.status <> 'confirmed' then
    raise exception 'So da para concluir pedido confirmado (status atual: %).', v_order.status;
  end if;

  select coalesce(sum(amount_cents), 0)
    into v_paid
    from public.payments
   where order_id = p_order_id and status = 'confirmed';

  v_remaining := v_order.total_cents - v_paid;

  if p_balance_received and v_remaining > 0 then
    insert into public.payments (order_id, amount_cents, status, confirmed_at, confirmed_by)
    values (p_order_id, v_remaining, 'confirmed', now(), auth.uid());

    v_paid := v_paid + v_remaining;
    v_remaining := 0;
  end if;

  update public.orders
     set status = 'completed', updated_at = now()
   where id = p_order_id;

  return jsonb_build_object(
    'order_id', p_order_id,
    'status', 'completed',
    'paid_cents', v_paid,
    'total_cents', v_order.total_cents,
    'remaining_cents', v_remaining
  );
end;
$$;

revoke all on function public.admin_complete_order(uuid, boolean) from public, anon;
grant execute on function public.admin_complete_order(uuid, boolean) to authenticated;
