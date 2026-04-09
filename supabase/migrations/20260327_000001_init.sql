create extension if not exists pgcrypto;

create type public.sex_option as enum (
  'female',
  'male',
  'nonbinary',
  'prefer-not'
);

create type public.goal_direction as enum (
  'lose',
  'maintain',
  'gain'
);

create type public.meal_type as enum (
  'breakfast',
  'lunch',
  'dinner',
  'snack'
);

create type public.intake_source as enum (
  'quick-add',
  'custom'
);

create type public.exercise_source as enum (
  'quick-add',
  'custom'
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,
  age integer,
  sex public.sex_option,
  current_weight_kg numeric(6, 2),
  goal_weight_kg numeric(6, 2),
  goal_direction public.goal_direction,
  daily_calorie_target integer,
  timezone text not null default 'UTC',
  setup_completed_at_utc timestamptz,
  created_at_utc timestamptz not null default timezone('utc', now()),
  updated_at_utc timestamptz not null default timezone('utc', now()),
  constraint profiles_age_check check (age is null or age between 10 and 120),
  constraint profiles_current_weight_check check (
    current_weight_kg is null or current_weight_kg > 0
  ),
  constraint profiles_goal_weight_check check (
    goal_weight_kg is null or goal_weight_kg > 0
  ),
  constraint profiles_daily_target_check check (
    daily_calorie_target is null or daily_calorie_target between 1000 and 6000
  )
);

create table public.intake_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  calories integer not null,
  meal_type public.meal_type not null,
  source public.intake_source not null,
  logged_at_utc timestamptz not null,
  local_date date not null,
  timezone_at_log text not null,
  deleted_at_utc timestamptz,
  created_at_utc timestamptz not null default timezone('utc', now()),
  updated_at_utc timestamptz not null default timezone('utc', now()),
  constraint intake_entries_name_check check (char_length(trim(name)) > 0),
  constraint intake_entries_calories_check check (calories >= 0)
);

create table public.exercise_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  calories_burned integer not null,
  source public.exercise_source not null,
  logged_at_utc timestamptz not null,
  local_date date not null,
  timezone_at_log text not null,
  deleted_at_utc timestamptz,
  created_at_utc timestamptz not null default timezone('utc', now()),
  updated_at_utc timestamptz not null default timezone('utc', now()),
  constraint exercise_entries_name_check check (char_length(trim(name)) > 0),
  constraint exercise_entries_burn_check check (calories_burned >= 0)
);

create table public.daily_summaries (
  user_id uuid not null references auth.users(id) on delete cascade,
  local_date date not null,
  total_intake_calories integer not null default 0,
  total_exercise_calories integer not null default 0,
  net_calories integer not null default 0,
  target_calories integer,
  remaining_calories integer,
  meal_count integer not null default 0,
  exercise_count integer not null default 0,
  source_recomputed_at_utc timestamptz not null default timezone('utc', now()),
  created_at_utc timestamptz not null default timezone('utc', now()),
  updated_at_utc timestamptz not null default timezone('utc', now()),
  primary key (user_id, local_date)
);

create table public.meal_pattern_shortcuts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pattern_key text not null,
  label text not null,
  meal_type public.meal_type not null,
  count integer not null default 0,
  average_calories integer not null default 0,
  first_seen_at_utc timestamptz,
  last_seen_at_utc timestamptz,
  refreshed_at_utc timestamptz not null default timezone('utc', now()),
  created_at_utc timestamptz not null default timezone('utc', now()),
  updated_at_utc timestamptz not null default timezone('utc', now()),
  constraint meal_pattern_shortcuts_count_check check (count >= 0),
  constraint meal_pattern_shortcuts_average_check check (average_calories >= 0),
  constraint meal_pattern_shortcuts_unique unique (user_id, pattern_key)
);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id text,
  event_name text not null,
  event_payload jsonb not null default '{}'::jsonb,
  local_date date,
  created_at_utc timestamptz not null default timezone('utc', now())
);

create table public.user_experiment_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  experiment_name text not null,
  variant text not null,
  assigned_at_utc timestamptz not null default timezone('utc', now()),
  constraint user_experiment_assignments_unique unique (user_id, experiment_name)
);

create index intake_entries_user_date_idx
  on public.intake_entries (user_id, local_date desc)
  where deleted_at_utc is null;

create index intake_entries_user_logged_idx
  on public.intake_entries (user_id, logged_at_utc desc)
  where deleted_at_utc is null;

create index exercise_entries_user_date_idx
  on public.exercise_entries (user_id, local_date desc)
  where deleted_at_utc is null;

create index exercise_entries_user_logged_idx
  on public.exercise_entries (user_id, logged_at_utc desc)
  where deleted_at_utc is null;

create index daily_summaries_user_date_idx
  on public.daily_summaries (user_id, local_date desc);

create index meal_pattern_shortcuts_user_count_idx
  on public.meal_pattern_shortcuts (user_id, count desc, refreshed_at_utc desc);

create index analytics_events_user_created_idx
  on public.analytics_events (user_id, created_at_utc desc);

create index analytics_events_anonymous_created_idx
  on public.analytics_events (anonymous_id, created_at_utc desc);

create index analytics_events_name_created_idx
  on public.analytics_events (event_name, created_at_utc desc);

create or replace function public.set_updated_at_utc()
returns trigger
language plpgsql
as $$
begin
  new.updated_at_utc = timezone('utc', now());
  return new;
end;
$$;

create trigger profiles_set_updated_at_utc
before update on public.profiles
for each row execute function public.set_updated_at_utc();

create trigger intake_entries_set_updated_at_utc
before update on public.intake_entries
for each row execute function public.set_updated_at_utc();

create trigger exercise_entries_set_updated_at_utc
before update on public.exercise_entries
for each row execute function public.set_updated_at_utc();

create trigger daily_summaries_set_updated_at_utc
before update on public.daily_summaries
for each row execute function public.set_updated_at_utc();

create trigger meal_pattern_shortcuts_set_updated_at_utc
before update on public.meal_pattern_shortcuts
for each row execute function public.set_updated_at_utc();

alter table public.profiles enable row level security;
alter table public.intake_entries enable row level security;
alter table public.exercise_entries enable row level security;
alter table public.daily_summaries enable row level security;
alter table public.meal_pattern_shortcuts enable row level security;
alter table public.analytics_events enable row level security;
alter table public.user_experiment_assignments enable row level security;

create policy "profiles are viewable by owner"
  on public.profiles
  for select
  using (auth.uid() = user_id);

create policy "profiles are insertable by owner"
  on public.profiles
  for insert
  with check (auth.uid() = user_id);

create policy "profiles are updatable by owner"
  on public.profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "intake entries are readable by owner"
  on public.intake_entries
  for select
  using (auth.uid() = user_id);

create policy "intake entries are writable by owner"
  on public.intake_entries
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "exercise entries are readable by owner"
  on public.exercise_entries
  for select
  using (auth.uid() = user_id);

create policy "exercise entries are writable by owner"
  on public.exercise_entries
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "daily summaries are readable by owner"
  on public.daily_summaries
  for select
  using (auth.uid() = user_id);

create policy "daily summaries are writable by owner"
  on public.daily_summaries
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "meal pattern shortcuts are readable by owner"
  on public.meal_pattern_shortcutsw
  for select
  using (auth.uid() = user_id);

create policy "meal pattern shortcuts are writable by owner"
  on public.meal_pattern_shortcuts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "analytics events are readable by owner"
  on public.analytics_events
  for select
  using (user_id is null or auth.uid() = user_id);

create policy "analytics events are insertable"
  on public.analytics_events
  for insert
  with check (user_id is null or auth.uid() = user_id);

create policy "user experiment assignments are readable by owner"
  on public.user_experiment_assignments
  for select
  using (auth.uid() = user_id);

create policy "user experiment assignments are writable by owner"
  on public.user_experiment_assignments
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
