-- agents table
create table if not exists public.agents (
    id text primary key,
    name text,
    xp integer default 0,
    status text default 'onboarding',
    current_phase text default 'apply',
    sponsor jsonb,
    co_sponsor jsonb,
    profile jsonb,
    phases jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- admins table
create table if not exists public.admins (
    email text primary key,
    name text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

insert into public.admins (email, name)
values 
    ('brian@brianburds.com', 'Brian Burds'),
    ('brenda@brianburds.com', 'Brenda Faudoa')
on conflict (email) do nothing;

-- global_settings table
create table if not exists public.global_settings (
    id text primary key,
    data jsonb default '{}'::jsonb,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- posts table
create table if not exists public.posts (
    id text primary key,
    author text,
    author_id text,
    role text,
    avatar text,
    timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
    text text,
    media text,
    audio text,
    presentation text,
    tags text[],
    likes text[],
    comments jsonb[]
);

-- events table
create table if not exists public.events (
    id text primary key,
    title text,
    date text,
    time text,
    end_time text,
    location text,
    description text,
    status text default 'pending',
    type text default 'general',
    instructor text,
    submitted_by text,
    attendees text[]
);

-- Enable RLS
alter table public.agents enable row level security;
alter table public.admins enable row level security;
alter table public.global_settings enable row level security;
alter table public.posts enable row level security;
alter table public.events enable row level security;

-- Policies
create policy "Allow public read access" on public.agents for select using (true);
create policy "Allow all actions" on public.agents for all using (true) with check (true);

create policy "Allow public read access to admins" on public.admins for select using (true);
create policy "Allow all actions on admins" on public.admins for all using (true) with check (true);

create policy "Allow public read access to global_settings" on public.global_settings for select using (true);
create policy "Allow all actions on global_settings" on public.global_settings for all using (true) with check (true);

create policy "Allow public read access" on public.posts for select using (true);
create policy "Allow all actions" on public.posts for all using (true) with check (true);

create policy "Allow public read access" on public.events for select using (true);
create policy "Allow all actions" on public.events for all using (true) with check (true);
