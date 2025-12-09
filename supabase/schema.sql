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

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;

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
