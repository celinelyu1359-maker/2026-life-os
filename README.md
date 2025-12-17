<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1sXm8IGUJ5RUzhWpO_tdYe4lhBfW0NpfN

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Optional: Supabase login + cloud sync

This project can run in **local-only** mode (localStorage) or in **cloud** mode using Supabase for full data synchronization across devices.

### 1) Add env vars
Edit `.env.local`:

- `VITE_SUPABASE_URL=...`
- `VITE_SUPABASE_ANON_KEY=...`

### 2) Create tables + RLS
In Supabase SQL Editor, run the complete schema from [`supabase-schema.sql`](./supabase-schema.sql), or copy the SQL below:

**Quick Setup (All Tables):**

```sql
-- Notes table (for Quick Notes)
create table if not exists public.notes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  content text,
  date date,
  type text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.notes enable row level security;

create policy "Users can read own notes" on public.notes for select using (auth.uid() = user_id);
create policy "Users can insert own notes" on public.notes for insert with check (auth.uid() = user_id);
create policy "Users can update own notes" on public.notes for update using (auth.uid() = user_id);
create policy "Users can delete own notes" on public.notes for delete using (auth.uid() = user_id);

-- Dashboard data table (Weekly Scoreboard, Challenges, Happy Hours)
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

create index if not exists idx_dashboard_data_user_week on public.dashboard_data(user_id, week_num, year);
alter table public.dashboard_data enable row level security;

create policy "Users can read own dashboard data" on public.dashboard_data for select using (auth.uid() = user_id);
create policy "Users can insert own dashboard data" on public.dashboard_data for insert with check (auth.uid() = user_id);
create policy "Users can update own dashboard data" on public.dashboard_data for update using (auth.uid() = user_id);
create policy "Users can delete own dashboard data" on public.dashboard_data for delete using (auth.uid() = user_id);

-- Monthly goals table
create table if not exists public.monthly_goals (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  month_index integer not null,
  year integer not null default 2026,
  goals jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, month_index, year)
);

create index if not exists idx_monthly_goals_user_month on public.monthly_goals(user_id, month_index, year);
alter table public.monthly_goals enable row level security;

create policy "Users can read own monthly goals" on public.monthly_goals for select using (auth.uid() = user_id);
create policy "Users can insert own monthly goals" on public.monthly_goals for insert with check (auth.uid() = user_id);
create policy "Users can update own monthly goals" on public.monthly_goals for update using (auth.uid() = user_id);
create policy "Users can delete own monthly goals" on public.monthly_goals for delete using (auth.uid() = user_id);

-- Annual settings table (Life Dimensions + 20 To Do)
create table if not exists public.annual_settings (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  year integer not null default 2026,
  dimensions jsonb not null default '[]'::jsonb,
  todos jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, year)
);

create index if not exists idx_annual_settings_user_year on public.annual_settings(user_id, year);
alter table public.annual_settings enable row level security;

create policy "Users can read own annual settings" on public.annual_settings for select using (auth.uid() = user_id);
create policy "Users can insert own annual settings" on public.annual_settings for insert with check (auth.uid() = user_id);
create policy "Users can update own annual settings" on public.annual_settings for update using (auth.uid() = user_id);
create policy "Users can delete own annual settings" on public.annual_settings for delete using (auth.uid() = user_id);

-- Auto-update updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_dashboard_data_updated_at before update on public.dashboard_data
  for each row execute function update_updated_at_column();

create trigger update_monthly_goals_updated_at before update on public.monthly_goals
  for each row execute function update_updated_at_column();

create trigger update_annual_settings_updated_at before update on public.annual_settings
  for each row execute function update_updated_at_column();

-- Reading & Movies table
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

create index if not exists idx_reading_movies_user on public.reading_movies(user_id);
alter table public.reading_movies enable row level security;

create policy "Users can read own reading movies" on public.reading_movies for select using (auth.uid() = user_id);
create policy "Users can insert own reading movies" on public.reading_movies for insert with check (auth.uid() = user_id);
create policy "Users can update own reading movies" on public.reading_movies for update using (auth.uid() = user_id);
create policy "Users can delete own reading movies" on public.reading_movies for delete using (auth.uid() = user_id);

create trigger update_reading_movies_updated_at before update on public.reading_movies
  for each row execute function update_updated_at_column();
```

**Note:** For the complete schema with all details, see [`supabase-schema.sql`](./supabase-schema.sql).

### 3) Run
```bash
npm install
npm run dev
```

### Cloud Sync Features

Once Supabase is configured and you're logged in, the following data will automatically sync across devices:

- ✅ **Quick Notes** - All notes created via Quick Note feature
- ✅ **Dashboard Data** - Weekly scoreboard, challenges, and happy hours
- ✅ **Monthly Goals** - All monthly priorities and goals
- ✅ **Annual Settings** - Life dimensions and 20 To Do items
- ✅ **Reading & Movies** - Books and movies with ratings, tags, and reviews

All data is also saved to localStorage as a fallback, so the app works offline and without Supabase configuration.

### Troubleshooting

**Error: "Could not find the 'date' column" or "Could not find the 'type' column"**

If you see errors about missing columns in the `notes` table, it means your table was created before all required columns were added. 

**Quick Fix:** Run the complete fix script from [`fix-notes-table.sql`](./fix-notes-table.sql) in Supabase SQL Editor. This script will automatically add all missing columns.

**Manual Fix:** If you prefer to fix manually, run this SQL:

```sql
-- Add missing date column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'notes' AND column_name = 'date'
    ) THEN
        ALTER TABLE public.notes ADD COLUMN date date;
        UPDATE public.notes SET date = created_at::date WHERE date IS NULL;
    END IF;
END $$;

-- Add missing type column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'notes' AND column_name = 'type'
    ) THEN
        ALTER TABLE public.notes ADD COLUMN type text DEFAULT 'note';
        UPDATE public.notes SET type = 'note' WHERE type IS NULL;
    END IF;
END $$;
```

**Verify:** After running the fix, verify the table structure:

```sql
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'notes'
ORDER BY ordinal_position;
```

You should see: `id`, `user_id`, `title`, `content`, `date`, `type`, `created_at`, `updated_at`.
