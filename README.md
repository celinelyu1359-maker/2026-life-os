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

## Optional: Supabase login + cloud sync (Notes)

This project can run in **local-only** mode (localStorage) or in **cloud** mode using Supabase.

### 1) Add env vars
Edit `.env.local`:

- `VITE_SUPABASE_URL=...`
- `VITE_SUPABASE_ANON_KEY=...`

### 2) Create table + RLS
In Supabase SQL Editor run:

```sql
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

create policy "Users can read own notes"
on public.notes for select
using (auth.uid() = user_id);

create policy "Users can insert own notes"
on public.notes for insert
with check (auth.uid() = user_id);

create policy "Users can update own notes"
on public.notes for update
using (auth.uid() = user_id);

create policy "Users can delete own notes"
on public.notes for delete
using (auth.uid() = user_id);
```

### 3) Run
```bash
npm install
npm run dev
```
