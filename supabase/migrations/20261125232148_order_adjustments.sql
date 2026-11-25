create table public.order_adjustments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id),
  amount_cents integer not null check (amount_cents <> 0),
  reason text not null check (length(btrim(reason)) between 3 and 200),
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index order_adjustments_order_id_idx on public.order_adjustments (order_id);

alter table public.order_adjustments enable row level security;

create policy "Admin le ajustes"
  on public.order_adjustments for select
  to authenticated
  using ((select public.is_admin()));

create or replace function public.admin_add_order_adjustment(
  p_order_id uuid,
  p_amount_cents integer,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reason text := btrim(coalesce(p_reason, ''));
  v_order record;
  v_paid integer;
  v_new integer;
begin
  if not (select public.is_admin()) then
    raise exception 'Acesso negado.';
  end if;

  if p_amount_cents is null or p_amount_cents = 0 then
    raise exception 'Informe um valor diferente de zero.';
  end if;

  if length(v_reason) < 3 or length(v_reason) > 200 then
    raise exception 'Informe o motivo do ajuste (3 a 200 caracteres).';
  end if;

  select id, status, total_cents
    into v_order
    from public.orders
   where id = p_order_id
     for update;

  if not found then
    raise exception 'Pedido nao encontrado.';
  end if;

  if v_order.status not in ('pending', 'confirmed') then
    raise exception 'So da para ajustar pedido pendente ou confirmado.';
  end if;

  v_new := v_order.total_cents + p_amount_cents;

  if v_new < 0 then
    raise exception 'O total nao pode ficar negativo.';
  end if;

  select coalesce(sum(amount_cents), 0)::integer
    into v_paid
    from public.payments
   where order_id = p_order_id
     and status = 'confirmed';

  if v_new < v_paid then
    raise exception 'O novo total ficaria abaixo do que ja foi pago (% centavos). Combine o reembolso pelo WhatsApp.', v_paid;
  end if;

  insert into public.order_adjustments (order_id, amount_cents, reason, created_by)
  values (p_order_id, p_amount_cents, v_reason, auth.uid());

  update public.orders
     set total_cents = v_new,
         updated_at = now()
   where id = p_order_id;

  return jsonb_build_object(
    'order_id', p_order_id,
    'previous_total_cents', v_order.total_cents,
    'adjustment_cents', p_amount_cents,
    'total_cents', v_new,
    'paid_cents', v_paid,
    'remaining_cents', v_new - v_paid
  );
end;
$$;

revoke all on function public.admin_add_order_adjustment(uuid, integer, text) from public, anon;
grant execute on function public.admin_add_order_adjustment(uuid, integer, text) to authenticated;
