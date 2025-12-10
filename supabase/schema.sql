-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  role text default 'user' check (role in ('user', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create categories table
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique,
  description text,
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

-- Create orders table
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')) not null,
  total decimal(10, 2) not null,
  shipping_address text not null,
  payment_method text,
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
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Policies

-- Profiles: Users can view their own profile, admins can view all
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

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
  with check ( auth.uid() = user_id );

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
  with check ( exists ( select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid() ) );

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
