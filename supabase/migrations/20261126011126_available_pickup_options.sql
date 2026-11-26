-- Opcoes de retirada para um carrinho (so le; e uma previa, nunca garantia)

alter table public.business_settings
  add column if not exists booking_window_days integer not null default 60
  check (booking_window_days between 1 and 365);

create or replace function public.available_pickup_options(p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window integer;
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_product_ids uuid[] := '{}';
  v_points integer := 0;
  v_ready jsonb := '[]'::jsonb;
  v_item record;
  v_earliest timestamptz;
  v_result jsonb;
begin
  -- carrinho (mesmas conferencias da create_order; sabor nao muda pontos nem prazo)
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'O carrinho esta invalido.';
  end if;

  if jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 30 then
    raise exception 'O carrinho esta vazio ou grande demais.';
  end if;

  if exists (
    select 1
      from jsonb_array_elements(p_items) e
     where (e->>'product_id') is null
        or coalesce((e->>'quantity')::integer, 0) < 1
  ) then
    raise exception 'Cada item precisa de produto e quantidade maior que zero.';
  end if;

  select booking_window_days into v_window from public.business_settings limit 1;

  if not found then
    raise exception 'Configuracao da loja ausente.';
  end if;

  -- produtos: encomenda gasta pontos e entra no prazo; pronta entrega usa estoque
  for v_item in
    select i.product_id, i.qty, p.id as found_id, p.name, p.production_points,
           p.active, p.deleted_at, p.is_ready_made
      from (
        select (e->>'product_id')::uuid as product_id,
               sum((e->>'quantity')::integer)::integer as qty
          from jsonb_array_elements(p_items) e
         group by 1
      ) i
      left join public.products p on p.id = i.product_id
  loop
    if v_item.found_id is null or not v_item.active or v_item.deleted_at is not null then
      raise exception 'Um dos produtos nao esta mais disponivel.';
    end if;

    if v_item.is_ready_made then
      v_ready := v_ready || jsonb_build_array(jsonb_build_object(
        'product_id', v_item.product_id, 'qty', v_item.qty));
    else
      v_points := v_points + v_item.production_points * v_item.qty;
      v_product_ids := v_product_ids || v_item.product_id;
    end if;
  end loop;

  -- primeiro instante possivel (mesma regra da create_order)
  v_earliest := public.earliest_pickup(v_product_ids);

  -- dias e horarios, cada horario com ok e motivo
  select coalesce(jsonb_agg(y.day_json order by y.production_date), '[]'::jsonb)
    into v_result
    from (
      select x.production_date,
             jsonb_build_object(
               'date', x.production_date,
               'slots', (
                 select jsonb_agg(jsonb_build_object(
                          'slot_id', s.id,
                          'time', to_char(s.slot_time, 'HH24:MI'),
                          'ok', r.reason is null,
                          'reason', r.reason
                        ) order by s.slot_time)
                   from public.pickup_slots s
                  cross join lateral (
                    select case
                      when ((x.production_date + s.slot_time) at time zone 'America/Sao_Paulo') < v_earliest then 'prazo'
                      when not x.points_ok then 'sem_pontos'
                      when not x.stock_ok then 'sem_estoque'
                    end as reason
                  ) r
                  where s.production_day_id = x.day_id and s.active
               )
             ) as day_json
        from (
          select d.id as day_id, d.production_date,
                 (v_points = 0 or public.day_available_points(d.id) >= v_points) as points_ok,
                 not exists (
                   select 1 from jsonb_array_elements(v_ready) rd
                    where public.ready_available(d.id, (rd->>'product_id')::uuid)
                          < (rd->>'qty')::integer
                 ) as stock_ok
            from public.production_days d
           where d.is_open
             and d.production_date between v_today and v_today + v_window
             and exists (select 1 from public.pickup_slots s2
                          where s2.production_day_id = d.id and s2.active)
        ) x
    ) y;

  return v_result;
end;
$$;

revoke all on function public.available_pickup_options(jsonb) from public, anon;
grant execute on function public.available_pickup_options(jsonb) to anon, authenticated;
