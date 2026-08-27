-- Open House Listings Table (Synced from Sisu Beta API)
create table if not exists public.listings (
    id text primary key,
    sisu_listing_id text,
    address text not null,
    price numeric,
    price_formatted text,
    listing_agent_id text,
    listing_agent_name text,
    seller_contact_name text,
    seller_contact_id text, -- Follow Up Boss Person/Contact ID if linked
    seller_phone text,
    status text default 'active', -- 'active' | 'pending' | 'sold'
    bedrooms integer,
    bathrooms numeric,
    sqft integer,
    cover_image text,
    notes text,
    last_synced_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Open House Bookings Table
create table if not exists public.open_house_bookings (
    id text primary key,
    listing_id text not null references public.listings(id) on delete cascade,
    agent_id text not null, -- Hosting agent email / ID
    agent_name text not null,
    agent_phone text,
    date text not null, -- 'YYYY-MM-DD'
    start_time text not null, -- 'HH:MM' (24hr or 12hr formatted)
    end_time text not null, -- 'HH:MM'
    status text default 'pending', -- 'pending' | 'approved' | 'rejected'
    fub_event_id text, -- Follow Up Boss calendar appointment/event ID
    notes text,
    rejection_reason text,
    requested_at timestamp with time zone default timezone('utc'::text, now()) not null,
    reviewed_at timestamp with time zone,
    reviewed_by text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Open House Coordinator / Weekly Report Settings
create table if not exists public.open_house_settings (
    id text primary key, -- 'default'
    deadline_day_of_week integer default 4, -- 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    deadline_time text default '17:00', -- 5:00 PM
    coordinator_name text default 'Listing Coordinator',
    coordinator_phone text default '+19152566989',
    coordinator_email text default 'admin@brianburds.com',
    last_report_sent_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for efficient lookups & overlap detection queries
create index if not exists idx_open_house_bookings_listing_date on public.open_house_bookings(listing_id, date);
create index if not exists idx_open_house_bookings_agent on public.open_house_bookings(agent_id);
create index if not exists idx_open_house_bookings_status on public.open_house_bookings(status);
create index if not exists idx_listings_status on public.listings(status);

-- Enable Row Level Security (RLS)
alter table public.listings enable row level security;
alter table public.open_house_bookings enable row level security;
alter table public.open_house_settings enable row level security;

-- Policies for listings
create policy "Allow public read access to listings" on public.listings for select using (true);
create policy "Allow all actions on listings" on public.listings for all using (true) with check (true);

-- Policies for bookings
create policy "Allow public read access to open_house_bookings" on public.open_house_bookings for select using (true);
create policy "Allow all actions on open_house_bookings" on public.open_house_bookings for all using (true) with check (true);

-- Policies for settings
create policy "Allow public read access to open_house_settings" on public.open_house_settings for select using (true);
create policy "Allow all actions on open_house_settings" on public.open_house_settings for all using (true) with check (true);
