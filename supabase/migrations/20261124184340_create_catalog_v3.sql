create type public.production_type as enum ('simple', 'special');

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id),
  name text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  size_label text,
  production_type public.production_type not null,
  production_points integer not null default 1 check (production_points > 0),
  preparation_lead_time_hours integer not null default 0 check (preparation_lead_time_hours >= 0),
  daily_cutoff_time time,
  max_per_order integer not null default 10 check (max_per_order > 0),
  active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_id_idx on public.products (category_id);

alter table public.categories enable row level security;
alter table public.products enable row level security;

create policy "Público lê categorias ativas"
  on public.categories for select
  to anon, authenticated
  using (active = true);

create policy "Público lê produtos ativos"
  on public.products for select
  to anon, authenticated
  using (active = true and deleted_at is null);