-- Admin Users Table
create table if not exists public.admins (
    email text primary key,
    name text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seed default master admins
insert into public.admins (email, name)
values 
    ('brian@brianburds.com', 'Brian Burds'),
    ('brenda@brianburds.com', 'Brenda Faudoa')
on conflict (email) do nothing;

-- Enable Row Level Security (RLS)
alter table public.admins enable row level security;

-- Policies for admins table
drop policy if exists "Allow public read access to admins" on public.admins;
create policy "Allow public read access to admins" on public.admins for select using (true);

drop policy if exists "Allow all actions on admins" on public.admins;
create policy "Allow all actions on admins" on public.admins for all using (true) with check (true);

-- Ensure global_settings table also exists for backups and snapshots
create table if not exists public.global_settings (
    id text primary key,
    data jsonb default '{}'::jsonb,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.global_settings enable row level security;
drop policy if exists "Allow public read access to global_settings" on public.global_settings;
create policy "Allow public read access to global_settings" on public.global_settings for select using (true);

drop policy if exists "Allow all actions on global_settings" on public.global_settings;
create policy "Allow all actions on global_settings" on public.global_settings for all using (true) with check (true);
