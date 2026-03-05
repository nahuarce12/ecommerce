-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  role text default 'user' check (role in ('user', 'admin')),
  phone varchar(20),
  address_line1 text,
  address_line2 text,
  city text,
  state_province text,
  postal_code varchar(10),
  country text default 'Argentina',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create categories table
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique,
  description text,
  size_measure_schema jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create products table
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique,
  description text,
  price decimal(10, 2) not null,
  category_id uuid references public.categories(id) on delete set null,
  brand text not null, -- Supreme, Nike, Bape, etc.
  stock integer default 0 not null,
  images text[] default '{}', -- Array of image URLs
  sizes text[] default '{}', -- Array of sizes available
  colors text[] default '{}', -- Array of colors available
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create product_sizes table (per-size stock, optional)
create table public.product_sizes (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  size_label text not null,
  stock integer not null default 0,
  measurements jsonb,
  unique(product_id, size_label)
);

-- Create orders table
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')) not null,
  payment_status text default 'pending_payment' check (payment_status in ('pending_payment', 'paid', 'failed')) not null,
  total decimal(10, 2) not null,
  shipping_cost decimal(10, 2) not null,
  shipping_address text not null,
  payment_method text,
  payment_proof_url text,
  tracking_number text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create order_items table
create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null, -- Store name in case product is deleted
  size text not null,
  color text not null,
  quantity integer not null check (quantity > 0),
  price_at_purchase decimal(10, 2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_sizes enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = user_id
      and role = 'admin'
  );
$$;

revoke execute on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to anon;
grant execute on function public.is_admin(uuid) to authenticated;
grant execute on function public.is_admin(uuid) to service_role;

-- Policies

-- Profiles: Users can view their own profile, admins can view all
create policy "Users can view their own profile"
  on profiles for select
  using ( auth.uid() = id );

create policy "Admins can view all profiles"
  on profiles for select
  using ( public.is_admin(auth.uid()) );

create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id )
  with check (
    auth.uid() = id
    and ( role = 'user' or public.is_admin(auth.uid()) )
  );

create policy "Admins can update all profiles"
  on profiles for update
  using ( public.is_admin(auth.uid()) )
  with check ( public.is_admin(auth.uid()) );

-- Categories: Everyone can view, only admins can insert/update
create policy "Categories are viewable by everyone"
  on categories for select
  using ( true );

create policy "Admins can insert categories"
  on categories for insert
  with check ( exists ( select 1 from profiles where id = auth.uid() and role = 'admin' ) );

create policy "Admins can update categories"
  on categories for update
  using ( exists ( select 1 from profiles where id = auth.uid() and role = 'admin' ) );

-- Product sizes: Everyone can view, only admins can manage
create policy "Product sizes are viewable by everyone"
  on product_sizes for select using ( true );

create policy "Admins can insert product sizes"
  on product_sizes for insert
  with check ( exists ( select 1 from profiles where id = auth.uid() and role = 'admin' ) );

create policy "Admins can update product sizes"
  on product_sizes for update
  using ( exists ( select 1 from profiles where id = auth.uid() and role = 'admin' ) );

create policy "Admins can delete product sizes"
  on product_sizes for delete
  using ( exists ( select 1 from profiles where id = auth.uid() and role = 'admin' ) );

-- Products: Everyone can view, only admins can insert/update
create policy "Products are viewable by everyone"
  on products for select
  using ( true );

create policy "Admins can insert products"
  on products for insert
  with check ( exists ( select 1 from profiles where id = auth.uid() and role = 'admin' ) );

create policy "Admins can update products"
  on products for update
  using ( exists ( select 1 from profiles where id = auth.uid() and role = 'admin' ) );

create policy "Admins can delete products"
  on products for delete
  using ( exists ( select 1 from profiles where id = auth.uid() and role = 'admin' ) );

create policy "Admins can delete categories"
  on categories for delete
  using ( exists ( select 1 from profiles where id = auth.uid() and role = 'admin' ) );

-- Orders: Users can view their own orders, admins can view all
create policy "Users can view their own orders"
  on orders for select
  using ( auth.uid() = user_id );

create policy "Admins can view all orders"
  on orders for select
  using ( exists ( select 1 from profiles where id = auth.uid() and role = 'admin' ) );

create policy "Users can insert their own orders"
  on orders for insert
  with check (
    auth.uid() = user_id
    and status = 'pending'
    and payment_status = 'pending_payment'
    and total >= 0
    and shipping_cost >= 0
    and tracking_number is null
  );

create policy "Admins can update orders"
  on orders for update
  using ( exists ( select 1 from profiles where id = auth.uid() and role = 'admin' ) );

-- Order items: Access controlled through orders table
create policy "Users can view their own order items"
  on order_items for select
  using ( exists ( select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid() ) );

create policy "Admins can view all order items"
  on order_items for select
  using ( exists ( select 1 from profiles where id = auth.uid() and role = 'admin' ) );

create policy "Users can insert order items for their orders"
  on order_items for insert
  with check (
    quantity > 0
    and price_at_purchase >= 0
    and exists ( select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid() )
  );

-- Insert default categories
insert into public.categories (name, slug, description) values
('Remeras', 'remeras', 'Remeras de marcas exclusivas'),
('Buzos', 'buzos', 'Buzos y hoodies'),
('Pantalones', 'pantalones', 'Pantalones y joggers'),
('Shorts', 'shorts', 'Shorts deportivos y casuales'),
('Camperas', 'camperas', 'Camperas y abrigos'),
('Accesorios', 'accesorios', 'Gorras, bolsos y más'),
('Gorras', 'gorras', 'Gorras de colección');

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to sync product total stock from product_sizes
create or replace function public.sync_product_total_stock()
returns trigger as $$
declare
  target_product_id uuid;
begin
  if TG_OP = 'DELETE' then
    target_product_id := OLD.product_id;
  else
    target_product_id := NEW.product_id;
  end if;

  update public.products
  set stock = coalesce((
    select sum(ps.stock) from public.product_sizes ps where ps.product_id = target_product_id
  ), 0)
  where id = target_product_id;

  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_product_sizes_change
  after insert or update or delete on public.product_sizes
  for each row
  execute procedure public.sync_product_total_stock();

-- Function to restore stock when order is cancelled
create or replace function public.restore_stock_on_cancel()
returns trigger as $$
begin
  if NEW.status = 'cancelled' and OLD.status != 'cancelled' then
    update public.product_sizes
    set stock = product_sizes.stock + oi.quantity
    from public.order_items oi
    where product_sizes.product_id = oi.product_id
      and product_sizes.size_label = oi.size
      and oi.order_id = NEW.id
      and oi.size is not null
      and oi.size != 'ÚNICO';

    update public.products
    set stock = products.stock + oi.quantity
    from public.order_items oi
    where products.id = oi.product_id
      and oi.order_id = NEW.id
      and (oi.size is null or oi.size = 'ÚNICO')
      and not exists (
        select 1 from public.product_sizes ps
        where ps.product_id = oi.product_id
      );
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

-- Trigger to restore stock on order cancellation
create trigger on_order_cancelled
  after update on public.orders
  for each row
  when (NEW.status = 'cancelled' and OLD.status != 'cancelled')
  execute procedure public.restore_stock_on_cancel();

-- Function for admin to manually cancel unpaid orders older than 72 hours
create or replace function public.cancel_unpaid_orders()
returns table (cancelled_count bigint) as $$
declare
  count bigint;
begin
  -- Only admins can execute this function
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Only admins can cancel unpaid orders';
  end if;

  update public.orders
  set status = 'cancelled',
      updated_at = now()
  where status = 'pending'
    and payment_status = 'pending_payment'
    and created_at < now() - interval '72 hours';
  
  get diagnostics count = ROW_COUNT;
  return query select count;
end;
$$ language plpgsql security definer;

-- Function to decrement product stock (supports per-size stock)
create or replace function public.decrement_stock(product_id uuid, quantity integer, size_label text default null)
returns void as $$
begin
  if size_label is not null and size_label != 'ÚNICO' then
    update public.product_sizes
    set stock = product_sizes.stock - quantity
    where product_sizes.product_id = decrement_stock.product_id
      and product_sizes.size_label = decrement_stock.size_label
      and product_sizes.stock >= quantity;

    if not found then
      raise exception 'Insufficient stock for product % size %', product_id, size_label;
    end if;
  else
    update public.products
    set stock = stock - quantity
    where id = product_id
      and stock >= quantity;

    if not found then
      raise exception 'Insufficient stock for product %', product_id;
    end if;
  end if;
end;
$$ language plpgsql security definer;

alter function public.handle_new_user() set search_path = public;
alter function public.sync_product_total_stock() set search_path = public;
alter function public.restore_stock_on_cancel() set search_path = public;
alter function public.cancel_unpaid_orders() set search_path = public;
alter function public.decrement_stock(uuid, integer, text) set search_path = public;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.sync_product_total_stock() from public, anon, authenticated;
revoke execute on function public.restore_stock_on_cancel() from public, anon, authenticated;
revoke execute on function public.cancel_unpaid_orders() from public, anon;
revoke execute on function public.decrement_stock(uuid, integer, text) from public, anon;

grant execute on function public.cancel_unpaid_orders() to authenticated;
grant execute on function public.decrement_stock(uuid, integer, text) to authenticated;
