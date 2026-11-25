create or replace function public.create_order(
  p_name text,
  p_phone text,
  p_pickup_slot_id uuid,
  p_items jsonb,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_hold_hours integer;
  v_max_pending integer;
  v_slot record;
  v_item record;
  v_product_ids uuid[] := '{}';
  v_lines jsonb := '[]'::jsonb;
  v_unit integer;
  v_total integer := 0;
  v_points integer := 0;
  v_pickup_at timestamptz;
  v_earliest timestamptz;
  v_customer_id uuid;
  v_pending integer;
  v_available integer;
  v_order_id uuid;
  v_expires timestamptz;
begin
  -- 1. nome e telefone
  if length(v_name) < 2 or length(v_name) > 100 then
    raise exception 'Informe seu nome.';
  end if;

  if length(v_phone) >= 12 and left(v_phone, 2) = '55' then
    v_phone := substr(v_phone, 3);
  end if;

  if length(v_phone) not in (10, 11) then
    raise exception 'Informe um telefone valido com DDD.';
  end if;

  if length(coalesce(p_notes, '')) > 500 then
    raise exception 'As observacoes passaram de 500 caracteres.';
  end if;

  -- 2. carrinho
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

  -- 3. regras da loja
  select reservation_hold_hours, max_pending_orders_per_phone
    into v_hold_hours, v_max_pending
    from public.business_settings
   limit 1;

  if not found then
    raise exception 'Configuracao da loja ausente.';
  end if;

  -- 4. horario e dia
  select s.active as slot_active, s.slot_time, d.id as day_id, d.production_date, d.is_open
    into v_slot
    from public.pickup_slots s
    join public.production_days d on d.id = s.production_day_id
   where s.id = p_pickup_slot_id;

  if not found then
    raise exception 'Esse horario de retirada nao existe.';
  end if;

  if not v_slot.slot_active or not v_slot.is_open then
    raise exception 'Esse horario de retirada nao esta disponivel.';
  end if;

  -- 5. produtos e sabores: preco, pontos e limites vem do banco
  for v_item in
    select i.product_id, i.flavor_id, i.qty,
           sum(i.qty) over (partition by i.product_id)::integer as product_qty,
           p.id as found_id, p.name, p.price_cents, p.production_points,
           p.max_per_order, p.active, p.deleted_at,
           f.id as found_flavor_id, f.name as flavor_name,
           f.price_cents as flavor_price, f.active as flavor_active,
           f.product_id as flavor_product_id,
           exists (
             select 1 from public.product_flavors x
              where x.product_id = i.product_id and x.active
           ) as has_flavors
      from (
        select (e->>'product_id')::uuid as product_id,
               nullif(e->>'flavor_id', '')::uuid as flavor_id,
               sum((e->>'quantity')::integer)::integer as qty
          from jsonb_array_elements(p_items) e
         group by 1, 2
      ) i
      left join public.products p on p.id = i.product_id
      left join public.product_flavors f on f.id = i.flavor_id
  loop
    if v_item.found_id is null or not v_item.active or v_item.deleted_at is not null then
      raise exception 'Um dos produtos nao esta mais disponivel.';
    end if;

    if v_item.product_qty > v_item.max_per_order then
      raise exception 'Quantidade acima do maximo por pedido para %.', v_item.name;
    end if;

    if v_item.has_flavors and v_item.flavor_id is null then
      raise exception 'Escolha o sabor de %.', v_item.name;
    end if;

    if v_item.flavor_id is not null and (
      v_item.found_flavor_id is null
      or v_item.flavor_product_id <> v_item.product_id
      or not v_item.flavor_active
    ) then
      raise exception 'Um dos sabores nao esta disponivel.';
    end if;

    v_unit := coalesce(v_item.flavor_price, v_item.price_cents);

    v_total := v_total + v_unit * v_item.qty;
    v_points := v_points + v_item.production_points * v_item.qty;
    v_product_ids := v_product_ids || v_item.product_id;

    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'product_id', v_item.product_id,
      'product_name', v_item.name,
      'flavor_name', v_item.flavor_name,
      'unit_price_cents', v_unit,
      'quantity', v_item.qty,
      'points', v_item.production_points
    ));
  end loop;

  -- 6. prazo minimo
  v_pickup_at := (v_slot.production_date + v_slot.slot_time) at time zone 'America/Sao_Paulo';
  v_earliest := public.earliest_pickup(v_product_ids);

  if v_pickup_at < v_earliest then
    raise exception 'Prazo insuficiente. A primeira retirada possivel e %.',
      to_char(v_earliest at time zone 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI');
  end if;

  -- 7. cliente (um telefone = um cliente) e limite de pendentes
  insert into public.customers (name, phone)
  values (v_name, v_phone)
  on conflict (phone) do update set phone = excluded.phone
  returning id into v_customer_id;

  select count(*) into v_pending
    from public.orders
   where customer_id = v_customer_id
     and status = 'pending'
     and hold_expires_at > now();

  if v_pending >= v_max_pending then
    raise exception 'Voce ja tem pedidos aguardando confirmacao. Aguarde a resposta da loja.';
  end if;

  -- 8. TRANCA O DIA e confere se cabe (a trava vem ANTES de olhar os pontos)
  perform 1 from public.production_days where id = v_slot.day_id for update;

  v_available := public.day_available_points(v_slot.day_id);

  if v_points > v_available then
    raise exception 'Nao ha vagas suficientes nesse dia. Pontos livres: %, necessarios: %.',
      v_available, v_points;
  end if;

  -- 9. grava tudo
  v_expires := now() + make_interval(hours => v_hold_hours);

  insert into public.orders (customer_id, pickup_slot_id, total_cents, notes, hold_expires_at)
  values (v_customer_id, p_pickup_slot_id, v_total,
          nullif(btrim(coalesce(p_notes, '')), ''), v_expires)
  returning id into v_order_id;

  insert into public.order_items
    (order_id, product_id, product_name, flavor_name, unit_price_cents, quantity, points_per_unit)
  select v_order_id,
         (l->>'product_id')::uuid,
         l->>'product_name',
         l->>'flavor_name',
         (l->>'unit_price_cents')::integer,
         (l->>'quantity')::integer,
         (l->>'points')::integer
    from jsonb_array_elements(v_lines) l;

  insert into public.production_reservations (order_id, production_day_id, points)
  values (v_order_id, v_slot.day_id, v_points);

  return jsonb_build_object(
    'order_id', v_order_id,
    'total_cents', v_total,
    'deposit_cents', (v_total + 1) / 2,
    'hold_expires_at', v_expires
  );
end;
$$;

revoke all on function public.create_order(text, text, uuid, jsonb, text) from public;
grant execute on function public.create_order(text, text, uuid, jsonb, text) to anon, authenticated;
