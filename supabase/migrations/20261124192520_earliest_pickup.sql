create or replace function public.earliest_pickup(
  p_product_ids uuid[],
  p_now timestamptz default now()
)
returns timestamptz
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_lead integer;
  v_cutoff time;
  v_local timestamp;
begin
  select coalesce(max(preparation_lead_time_hours), 0), min(daily_cutoff_time)
    into v_lead, v_cutoff
  from public.products
  where id = any(p_product_ids);

  v_local := p_now at time zone 'America/Sao_Paulo';

  if v_cutoff is not null and v_local::time > v_cutoff then
    v_local := date_trunc('day', v_local) + interval '1 day';
  end if;

  return (v_local + make_interval(hours => v_lead)) at time zone 'America/Sao_Paulo';
end;
$$;
