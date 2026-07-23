-- agents table
create table public.agents (
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

-- posts table
create table public.posts (
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
create table public.events (
    id text primary key,
    title text,
    date text,
    time text,
    end_time text,
    location text,
    description text,
    status text default 'pending',
    type text default 'general',
    attendees text[]
);

-- Enable RLS
alter table public.agents enable row level security;
alter table public.posts enable row level security;
alter table public.events enable row level security;

-- Policies
create policy "Allow public read access" on public.agents for select using (true);
create policy "Allow all actions" on public.agents for all using (true) with check (true);

create policy "Allow public read access" on public.posts for select using (true);
create policy "Allow all actions" on public.posts for all using (true) with check (true);

create policy "Allow public read access" on public.events for select using (true);
create policy "Allow all actions" on public.events for all using (true) with check (true);
