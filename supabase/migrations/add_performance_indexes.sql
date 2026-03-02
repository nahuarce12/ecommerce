create index if not exists idx_orders_user_created_at_desc
on public.orders(user_id, created_at desc);

create index if not exists idx_orders_status_created_at_desc
on public.orders(status, created_at desc);

create index if not exists idx_orders_payment_status_created_at_desc
on public.orders(payment_status, created_at desc);

create index if not exists idx_order_items_order_id
on public.order_items(order_id);

create index if not exists idx_products_created_at_desc
on public.products(created_at desc);
