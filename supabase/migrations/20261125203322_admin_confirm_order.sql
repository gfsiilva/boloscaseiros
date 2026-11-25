-- Painel: admin confirma a entrada (PIX) de um pedido

alter table public.payments
  add column if not exists confirmed_by uuid references auth.users (id) on delete set null;

create or replace function public.admin_confirm_order(
  p_order_id uuid,
  p_amount_cents integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order record;
  v_amount integer;
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

  if v_order.status = 'expired' then
    raise exception 'Esse pedido expirou. Use a reativacao, que confere a vaga.';
  end if;

  if v_order.status <> 'pending' then
    raise exception 'Esse pedido nao esta pendente (status atual: %).', v_order.status;
  end if;

  v_amount := coalesce(p_amount_cents, (v_order.total_cents + 1) / 2);

  if v_amount < 1 or v_amount > v_order.total_cents then
    raise exception 'Valor invalido. Deve ficar entre 1 centavo e o total do pedido (% centavos).', v_order.total_cents;
  end if;

  insert into public.payments (order_id, amount_cents, status, confirmed_at, confirmed_by)
  values (p_order_id, v_amount, 'confirmed', now(), auth.uid());

  update public.orders
     set status = 'confirmed', updated_at = now()
   where id = p_order_id;

  return jsonb_build_object(
    'order_id', p_order_id,
    'status', 'confirmed',
    'paid_cents', v_amount,
    'total_cents', v_order.total_cents,
    'remaining_cents', v_order.total_cents - v_amount
  );
end;
$$;

revoke all on function public.admin_confirm_order(uuid, integer) from public, anon;
grant execute on function public.admin_confirm_order(uuid, integer) to authenticated;
