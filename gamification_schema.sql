-- XP Events Table for Audit Trail & Time-Window Leaderboards
create table if not exists public.xp_events (
    id text primary key,
    agent_id text not null,
    source_type text not null, -- 'playbook_task' | 'training_feed_like' | 'training_feed_unlike' | 'manual_admin_award' | 'event_checkin'
    source_id text,
    xp_amount integer not null,
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index on agent_id and created_at for fast leaderboard window queries
create index if not exists idx_xp_events_agent_id on public.xp_events (agent_id);
create index if not exists idx_xp_events_created_at on public.xp_events (created_at desc);

-- Enable RLS
alter table public.xp_events enable row level security;

-- Policies
create policy "Allow public read access to xp_events" on public.xp_events for select using (true);
create policy "Allow all actions on xp_events" on public.xp_events for all using (true) with check (true);
