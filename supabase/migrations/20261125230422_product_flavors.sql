create table public.product_flavors (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id),
  name text not null check (length(trim(name)) > 0),
  price_cents integer not null check (price_cents >= 0),
  sort_order integer not null default 0,
  image_path text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (product_id, name)
);

create index product_flavors_product_id_idx on public.product_flavors (product_id);

alter table public.order_items add column flavor_name text;

alter table public.product_flavors enable row level security;

create policy "Publico le sabores ativos"
  on public.product_flavors for select
  to anon, authenticated
  using (
    active = true
    and exists (
      select 1 from public.products p
      where p.id = product_id and p.active = true and p.deleted_at is null
    )
  );

create policy "Admin le todos os sabores"
  on public.product_flavors for select
  to authenticated
  using ((select public.is_admin()));

create policy "Admin cria sabores"
  on public.product_flavors for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "Admin altera sabores"
  on public.product_flavors for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
