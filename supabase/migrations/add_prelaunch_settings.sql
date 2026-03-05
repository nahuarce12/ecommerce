create table if not exists public.prelaunch_settings (
  id boolean primary key default true check (id = true),
  enabled boolean not null default false,
  launch_at timestamp with time zone not null default '2026-03-07T21:00:00Z',
  timezone text not null default 'America/Argentina/Buenos_Aires',
  password_hash text not null default '',
  password_version integer not null default 1 check (password_version > 0),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

insert into public.prelaunch_settings (id)
values (true)
on conflict (id) do nothing;

alter table public.prelaunch_settings enable row level security;

create policy "Admins can read prelaunch settings"
  on public.prelaunch_settings for select
  using (public.is_admin(auth.uid()));

create policy "Admins can insert prelaunch settings"
  on public.prelaunch_settings for insert
  with check (public.is_admin(auth.uid()));

create policy "Admins can update prelaunch settings"
  on public.prelaunch_settings for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create or replace function public.get_prelaunch_public_settings()
returns table (
  enabled boolean,
  launch_at timestamp with time zone,
  timezone text,
  password_version integer,
  is_open boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ps.enabled,
    ps.launch_at,
    ps.timezone,
    ps.password_version,
    now() >= ps.launch_at as is_open
  from public.prelaunch_settings ps
  where ps.id = true
  limit 1;
$$;

revoke execute on function public.get_prelaunch_public_settings() from public;
grant execute on function public.get_prelaunch_public_settings() to anon;
grant execute on function public.get_prelaunch_public_settings() to authenticated;
grant execute on function public.get_prelaunch_public_settings() to service_role;
