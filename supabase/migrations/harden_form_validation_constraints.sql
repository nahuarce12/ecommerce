alter table public.products
  add constraint products_price_non_negative
  check (price >= 0) not valid;

alter table public.products
  add constraint products_stock_non_negative
  check (stock >= 0) not valid;

alter table public.products
  add constraint products_name_not_blank
  check (char_length(trim(name)) > 0) not valid;

alter table public.products
  add constraint products_brand_not_blank
  check (char_length(trim(brand)) > 0) not valid;

alter table public.categories
  add constraint categories_name_not_blank
  check (char_length(trim(name)) > 0) not valid;

alter table public.categories
  add constraint categories_slug_kebab
  check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$') not valid;

alter table public.product_sizes
  add constraint product_sizes_stock_non_negative
  check (stock >= 0) not valid;

alter table public.orders
  add constraint orders_total_non_negative
  check (total >= 0) not valid;

alter table public.orders
  add constraint orders_shipping_cost_non_negative
  check (shipping_cost >= 0) not valid;

alter table public.order_items
  add constraint order_items_price_non_negative
  check (price_at_purchase >= 0) not valid;
