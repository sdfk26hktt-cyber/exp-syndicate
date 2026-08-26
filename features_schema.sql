-- Team Passwords table
create table public.team_passwords (
    id text primary key,
    app_name text not null,
    url text,
    username text,
    password text not null,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Resources table
create table public.resources (
    id text primary key,
    title text not null,
    category text not null,
    type text not null,
    url text,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- FAQs table
create table public.faqs (
    id text primary key,
    question text not null,
    answer text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.team_passwords enable row level security;
alter table public.resources enable row level security;
alter table public.faqs enable row level security;

-- Policies
create policy "Allow team agents and admins to read passwords" on public.team_passwords for select using (true);
create policy "Allow all actions on passwords" on public.team_passwords for all using (true) with check (true);

create policy "Allow public read access to resources" on public.resources for select using (true);
create policy "Allow all actions on resources" on public.resources for all using (true) with check (true);

create policy "Allow public read access to faqs" on public.faqs for select using (true);
create policy "Allow all actions on faqs" on public.faqs for all using (true) with check (true);

-- Add attached_resources to posts table
alter table public.posts add column if not exists attached_resources jsonb[] default '{}';

-- Add instructor and submitted_by to events table
alter table public.events add column if not exists instructor text;
alter table public.events add column if not exists submitted_by text;

