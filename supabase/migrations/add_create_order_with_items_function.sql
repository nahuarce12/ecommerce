create or replace function public.create_order_with_items(
  p_payment_method text,
  p_shipping_cost numeric,
  p_shipping_address text,
  p_items jsonb,
  p_should_decrement_stock boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order_id uuid;
  v_order_total numeric := 0;
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_size text;
  v_color text;
  v_product_name text;
  v_product_price numeric;
  v_product_stock integer;
  v_size_stock integer;
begin
  if v_user_id is null then
    raise exception 'NO AUTENTICADO';
  end if;

  if coalesce(trim(p_payment_method), '') = '' then
    raise exception 'MÉTODO DE PAGO INVÁLIDO';
  end if;

  if p_shipping_cost is null or p_shipping_cost < 0 then
    raise exception 'COSTO DE ENVÍO INVÁLIDO';
  end if;

  if coalesce(trim(p_shipping_address), '') = '' then
    raise exception 'DIRECCIÓN DE ENVÍO INCOMPLETA';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'CARRITO VACÍO';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    if coalesce(v_item->>'product_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      raise exception 'ITEMS INVÁLIDOS EN EL CARRITO';
    end if;

    if coalesce(v_item->>'quantity', '') !~ '^[0-9]+$' then
      raise exception 'ITEMS INVÁLIDOS EN EL CARRITO';
    end if;

    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    v_size := coalesce(nullif(trim(v_item->>'size'), ''), 'ÚNICO');
    v_color := coalesce(nullif(trim(v_item->>'color'), ''), 'DEFAULT');

    if v_quantity < 1 or v_quantity > 50 then
      raise exception 'ITEMS INVÁLIDOS EN EL CARRITO';
    end if;

    select p.name, p.price, p.stock
    into v_product_name, v_product_price, v_product_stock
    from public.products p
    where p.id = v_product_id
    for update;

    if not found then
      raise exception 'PRODUCTO NO ENCONTRADO';
    end if;

    if v_size <> 'ÚNICO' then
      select ps.stock
      into v_size_stock
      from public.product_sizes ps
      where ps.product_id = v_product_id
        and ps.size_label = v_size
      for update;

      if found then
        if v_size_stock < v_quantity then
          raise exception 'STOCK INSUFICIENTE PARA % TALLE %. DISPONIBLE: %', v_product_name, v_size, v_size_stock;
        end if;
      elsif v_product_stock < v_quantity then
        raise exception 'STOCK INSUFICIENTE PARA %. DISPONIBLE: %', v_product_name, v_product_stock;
      end if;
    elsif v_product_stock < v_quantity then
      raise exception 'STOCK INSUFICIENTE PARA %. DISPONIBLE: %', v_product_name, v_product_stock;
    end if;

    v_order_total := v_order_total + (v_product_price * v_quantity);
  end loop;

  insert into public.orders (
    user_id,
    status,
    payment_status,
    total,
    shipping_cost,
    shipping_address,
    payment_method
  ) values (
    v_user_id,
    'pending',
    'pending_payment',
    v_order_total + p_shipping_cost,
    p_shipping_cost,
    p_shipping_address,
    p_payment_method
  )
  returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    v_size := coalesce(nullif(trim(v_item->>'size'), ''), 'ÚNICO');
    v_color := coalesce(nullif(trim(v_item->>'color'), ''), 'DEFAULT');

    select p.name, p.price
    into v_product_name, v_product_price
    from public.products p
    where p.id = v_product_id;

    insert into public.order_items (
      order_id,
      product_id,
      product_name,
      quantity,
      price_at_purchase,
      size,
      color
    ) values (
      v_order_id,
      v_product_id,
      v_product_name,
      v_quantity,
      v_product_price,
      v_size,
      v_color
    );

    if p_should_decrement_stock then
      perform public.decrement_stock(
        v_product_id,
        v_quantity,
        case when v_size <> 'ÚNICO' then v_size else null end
      );
    end if;
  end loop;

  return v_order_id;
end;
$$;

revoke execute on function public.create_order_with_items(text, numeric, text, jsonb, boolean) from public, anon;
grant execute on function public.create_order_with_items(text, numeric, text, jsonb, boolean) to authenticated;
