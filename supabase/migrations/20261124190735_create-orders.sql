create type public.order_status as enum ('pending', 'confirmed', 'completed', 'cancelled', 'expired');
create type public.payment_status as enum ('pending', 'confirmed');
create type public.reservation_status as enum ('active', 'released');

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  email text,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id),
  pickup_slot_id uuid not null references public.pickup_slots (id),
  status public.order_status not null default 'pending',
  total_cents integer not null check (total_cents >= 0),
  notes text,
  hold_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id),
  product_id uuid not null references public.products (id),
  product_name text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0),
  points_per_unit integer not null check (points_per_unit > 0),
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id),
  amount_cents integer not null check (amount_cents >= 0),
  method text not null default 'pix',
  status public.payment_status not null default 'pending',
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.production_reservations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id),
  production_day_id uuid not null references public.production_days (id),
  points integer not null check (points > 0),
  status public.reservation_status not null default 'active',
  created_at timestamptz not null default now()
);

create index orders_customer_id_idx on public.orders (customer_id);
create index orders_pickup_slot_id_idx on public.orders (pickup_slot_id);
create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);
create index payments_order_id_idx on public.payments (order_id);
create index production_reservations_day_idx on public.production_reservations (production_day_id);

alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.production_reservations enable row level security;
