-- =======================================================
-- 2026 Life OS - Supabase Database Schema
-- =======================================================
-- Run this in Supabase SQL Editor after setting up your project
-- =======================================================

-- 1. Dashboard Data Table (Weekly Scoreboard, Challenges, Happy Hours)
-- =======================================================
create table if not exists public.dashboard_data (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  week_num integer not null,
  year integer not null default 2026,
  scoreboard jsonb not null default '[]'::jsonb,
  challenges jsonb not null default '[]'::jsonb,
  happy_hours jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, week_num, year)
);

-- Index for faster queries
create index if not exists idx_dashboard_data_user_week on public.dashboard_data(user_id, week_num, year);

-- Enable RLS
alter table public.dashboard_data enable row level security;

-- RLS Policies
create policy "Users can read own dashboard data"
on public.dashboard_data for select
using (auth.uid() = user_id);

create policy "Users can insert own dashboard data"
on public.dashboard_data for insert
with check (auth.uid() = user_id);

create policy "Users can update own dashboard data"
on public.dashboard_data for update
using (auth.uid() = user_id);

create policy "Users can delete own dashboard data"
on public.dashboard_data for delete
using (auth.uid() = user_id);

-- 2. Monthly Goals Table
-- =======================================================
create table if not exists public.monthly_goals (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  month_index integer not null,
  year integer not null default 2026,
  goals jsonb not null default '[]'::jsonb,
  theme text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, month_index, year)
);

-- Index for faster queries
create index if not exists idx_monthly_goals_user_month on public.monthly_goals(user_id, month_index, year);

-- Enable RLS
alter table public.monthly_goals enable row level security;

-- RLS Policies
create policy "Users can read own monthly goals"
on public.monthly_goals for select
using (auth.uid() = user_id);

create policy "Users can insert own monthly goals"
on public.monthly_goals for insert
with check (auth.uid() = user_id);

create policy "Users can update own monthly goals"
on public.monthly_goals for update
using (auth.uid() = user_id);

create policy "Users can delete own monthly goals"
on public.monthly_goals for delete
using (auth.uid() = user_id);

-- 3. Annual Settings Table (Life Dimensions + 20 To Do)
-- =======================================================
create table if not exists public.annual_settings (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  year integer not null default 2026,
  dimensions jsonb not null default '[]'::jsonb,
  todos jsonb not null default '[]'::jsonb,
  motto text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, year)
);

-- Index for faster queries
create index if not exists idx_annual_settings_user_year on public.annual_settings(user_id, year);

-- Enable RLS
alter table public.annual_settings enable row level security;

-- RLS Policies
create policy "Users can read own annual settings"
on public.annual_settings for select
using (auth.uid() = user_id);

create policy "Users can insert own annual settings"
on public.annual_settings for insert
with check (auth.uid() = user_id);

create policy "Users can update own annual settings"
on public.annual_settings for update
using (auth.uid() = user_id);

create policy "Users can delete own annual settings"
on public.annual_settings for delete
using (auth.uid() = user_id);

-- =======================================================
-- Helper Function: Auto-update updated_at timestamp
-- =======================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply trigger to all tables
create trigger update_dashboard_data_updated_at before update on public.dashboard_data
  for each row execute function update_updated_at_column();

create trigger update_monthly_goals_updated_at before update on public.monthly_goals
  for each row execute function update_updated_at_column();

create trigger update_annual_settings_updated_at before update on public.annual_settings
  for each row execute function update_updated_at_column();

-- 4. Reading & Movies Table
-- =======================================================
create table if not exists public.reading_movies (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  type text not null check (type in ('book', 'movie')),
  rating integer not null check (rating >= 1 and rating <= 5),
  tags jsonb not null default '[]'::jsonb,
  review text,
  date_finished date not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for faster queries
create index if not exists idx_reading_movies_user on public.reading_movies(user_id);
create index if not exists idx_reading_movies_type on public.reading_movies(type);
create index if not exists idx_reading_movies_date on public.reading_movies(date_finished);

-- Enable RLS
alter table public.reading_movies enable row level security;

-- RLS Policies
create policy "Users can read own reading movies"
on public.reading_movies for select
using (auth.uid() = user_id);

create policy "Users can insert own reading movies"
on public.reading_movies for insert
with check (auth.uid() = user_id);

create policy "Users can update own reading movies"
on public.reading_movies for update
using (auth.uid() = user_id);

create policy "Users can delete own reading movies"
on public.reading_movies for delete
using (auth.uid() = user_id);

-- Auto-update trigger
create trigger update_reading_movies_updated_at before update on public.reading_movies
  for each row execute function update_updated_at_column();

