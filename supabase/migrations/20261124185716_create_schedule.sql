create table public.business_settings (
  id boolean primary key default true check (id),
  default_daily_capacity_points integer not null default 8 check (default_daily_capacity_points > 0),
  reservation_hold_hours integer not null default 24 check (reservation_hold_hours > 0),
  updated_at timestamptz not null default now()
);

insert into public.business_settings (id) values (true);

create table public.production_days (
  id uuid primary key default gen_random_uuid(),
  production_date date not null unique,
  capacity_points integer check (capacity_points > 0),
  is_open boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create table public.pickup_slots (
  id uuid primary key default gen_random_uuid(),
  production_day_id uuid not null references public.production_days (id),
  slot_time time not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (production_day_id, slot_time)
);

create index pickup_slots_production_day_id_idx on public.pickup_slots (production_day_id);

alter table public.business_settings enable row level security;
alter table public.production_days enable row level security;
alter table public.pickup_slots enable row level security;

create policy "Público lê dias abertos"
  on public.production_days for select
  to anon, authenticated
  using (is_open = true);

create policy "Público lê horários ativos"
  on public.pickup_slots for select
  to anon, authenticated
  using (
    active = true
    and exists (
      select 1 from public.production_days d
      where d.id = production_day_id and d.is_open = true
    )
  );
