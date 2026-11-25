alter table public.products
  add column is_ready_made boolean not null default false;

create table public.ready_stock (
  id uuid primary key default gen_random_uuid(),
  production_day_id uuid not null references public.production_days (id),
  product_id uuid not null references public.products (id),
  quantity integer not null check (quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (production_day_id, product_id)
);

create index ready_stock_product_id_idx on public.ready_stock (product_id);

alter table public.ready_stock enable row level security;

create policy "Admin le estoque"
  on public.ready_stock for select to authenticated
  using ((select public.is_admin()));

create policy "Admin cria estoque"
  on public.ready_stock for insert to authenticated
  with check ((select public.is_admin()));

create policy "Admin altera estoque"
  on public.ready_stock for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create or replace function public.ready_available(p_day_id uuid, p_product_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select (
    coalesce((
      select rs.quantity
        from public.ready_stock rs
       where rs.production_day_id = p_day_id
         and rs.product_id = p_product_id
    ), 0)
    - coalesce((
      select sum(oi.quantity)
        from public.order_items oi
        join public.orders o on o.id = oi.order_id
        join public.pickup_slots s on s.id = o.pickup_slot_id
       where s.production_day_id = p_day_id
         and oi.product_id = p_product_id
         and o.status in ('pending', 'confirmed', 'completed')
    ), 0)
  )::integer;
$$;

revoke all on function public.ready_available(uuid, uuid) from public;
grant execute on function public.ready_available(uuid, uuid) to anon, authenticated;
