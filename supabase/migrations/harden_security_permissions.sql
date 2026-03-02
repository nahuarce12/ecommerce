drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);
create policy "Admins can view all profiles"
  on public.profiles for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );
create policy "Admins can update all profiles"
  on public.profiles for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Users can insert their own orders" on public.orders;
create policy "Users can insert their own orders"
  on public.orders for insert
  with check (
    auth.uid() = user_id
    and status = 'pending'
    and payment_status = 'pending_payment'
    and total >= 0
    and shipping_cost >= 0
    and tracking_number is null
  );

drop policy if exists "Users can insert order items for their orders" on public.order_items;
create policy "Users can insert order items for their orders"
  on public.order_items for insert
  with check (
    quantity > 0
    and price_at_purchase >= 0
    and exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
  );
