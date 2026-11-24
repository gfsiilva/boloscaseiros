create or replace function public.day_capacity(p_day_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(d.capacity_points, s.default_daily_capacity_points)
  from public.production_days d
  cross join public.business_settings s
  where d.id = p_day_id;
$$;

create or replace function public.day_used_points(p_day_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(points), 0)::integer
  from public.production_reservations
  where production_day_id = p_day_id
    and status = 'active';
$$;

create or replace function public.day_available_points(p_day_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select public.day_capacity(p_day_id) - public.day_used_points(p_day_id);
$$;
