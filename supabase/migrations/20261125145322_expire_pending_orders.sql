create or replace function public.expire_pending_orders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  with vencidos as (
    update public.orders
    set status = 'expired',
        updated_at = now()
    where status = 'pending'
      and hold_expires_at is not null
      and hold_expires_at < now()
    returning id
  ),
  soltas as (
    update public.production_reservations
    set status = 'released'
    where order_id in (select id from vencidos)
      and status = 'active'
    returning id
  )
  select count(*) into v_count from vencidos;

  return v_count;
end;
$$;

revoke all on function public.expire_pending_orders() from public, anon, authenticated;
