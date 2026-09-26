-- ==============================================================================
-- PROJECT NATAL: COMPLETE SUPABASE MIGRATION
-- Run this script in your Supabase SQL Editor:
-- Supabase Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ==============================================================================

-- 1. Profiles Table (Extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text,
  avatar_url text,
  tier text default 'free' check (tier in ('free', 'onetime', 'pro')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger to auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url, tier)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'free'
  )
  on conflict (id) do update set
    email = excluded.email,
    name = coalesce(excluded.name, profiles.name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Family Trees Table
create table if not exists public.family_trees (
  id text primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  slug text unique not null,
  description text,
  settings jsonb default '{"isPublic": true, "allowClaiming": false, "theme": "default"}'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. People Table
create table if not exists public.people (
  id text primary key,
  tree_id text references public.family_trees(id) on delete cascade not null,
  first_name text not null,
  last_name text default '',
  maiden_name text,
  nickname text,
  gender text check (gender in ('male', 'female', 'other', null)),
  birth_date text,
  death_date text,
  birth_place text,
  photo_url text,
  bio text,
  custom_fields jsonb default '{}'::jsonb not null,
  milestones jsonb default '[]'::jsonb not null,
  position_x double precision default 0 not null,
  position_y double precision default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Relationships Table
create table if not exists public.relationships (
  id text primary key,
  tree_id text references public.family_trees(id) on delete cascade not null,
  person_a_id text references public.people(id) on delete cascade not null,
  person_b_id text references public.people(id) on delete cascade not null,
  type text check (type in ('parent_child', 'spouse', 'sibling')) not null,
  subtype text check (subtype in ('biological', 'step', 'adoptive', 'half')) not null,
  start_date text,
  end_date text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Performance Indexes
create index if not exists idx_trees_owner on public.family_trees(owner_id);
create index if not exists idx_trees_slug on public.family_trees(slug);
create index if not exists idx_people_tree on public.people(tree_id);
create index if not exists idx_relationships_tree on public.relationships(tree_id);

-- 6. Row Level Security (RLS) Configuration
alter table public.profiles enable row level security;
alter table public.family_trees enable row level security;
alter table public.people enable row level security;
alter table public.relationships enable row level security;

-- Clean existing policies if re-running
drop policy if exists "Profiles select policy" on public.profiles;
drop policy if exists "Profiles update policy" on public.profiles;
drop policy if exists "Trees select policy" on public.family_trees;
drop policy if exists "Trees insert policy" on public.family_trees;
drop policy if exists "Trees update policy" on public.family_trees;
drop policy if exists "Trees delete policy" on public.family_trees;
drop policy if exists "People select policy" on public.people;
drop policy if exists "People insert policy" on public.people;
drop policy if exists "People update policy" on public.people;
drop policy if exists "People delete policy" on public.people;
drop policy if exists "Relationships select policy" on public.relationships;
drop policy if exists "Relationships insert policy" on public.relationships;
drop policy if exists "Relationships update policy" on public.relationships;
drop policy if exists "Relationships delete policy" on public.relationships;

-- Profiles Policies
create policy "Profiles select policy" on public.profiles
  for select using (true);

create policy "Profiles update policy" on public.profiles
  for update using (auth.uid() = id);

-- Family Trees Policies
create policy "Trees select policy" on public.family_trees
  for select using (
    auth.uid() = owner_id or (settings->>'isPublic')::boolean = true
  );

create policy "Trees insert policy" on public.family_trees
  for insert with check (auth.uid() = owner_id);

create policy "Trees update policy" on public.family_trees
  for update using (auth.uid() = owner_id);

create policy "Trees delete policy" on public.family_trees
  for delete using (auth.uid() = owner_id);

-- People Policies (Cascades permissions from parent tree)
create policy "People select policy" on public.people
  for select using (
    exists (
      select 1 from public.family_trees
      where id = people.tree_id and (auth.uid() = owner_id or (settings->>'isPublic')::boolean = true)
    )
  );

create policy "People insert policy" on public.people
  for insert with check (
    exists (
      select 1 from public.family_trees
      where id = people.tree_id and auth.uid() = owner_id
    )
  );

create policy "People update policy" on public.people
  for update using (
    exists (
      select 1 from public.family_trees
      where id = people.tree_id and auth.uid() = owner_id
    )
  );

create policy "People delete policy" on public.people
  for delete using (
    exists (
      select 1 from public.family_trees
      where id = people.tree_id and auth.uid() = owner_id
    )
  );

-- Relationships Policies (Cascades permissions from parent tree)
create policy "Relationships select policy" on public.relationships
  for select using (
    exists (
      select 1 from public.family_trees
      where id = relationships.tree_id and (auth.uid() = owner_id or (settings->>'isPublic')::boolean = true)
    )
  );

create policy "Relationships insert policy" on public.relationships
  for insert with check (
    exists (
      select 1 from public.family_trees
      where id = relationships.tree_id and auth.uid() = owner_id
    )
  );

create policy "Relationships update policy" on public.relationships
  for update using (
    exists (
      select 1 from public.family_trees
      where id = relationships.tree_id and auth.uid() = owner_id
    )
  );

create policy "Relationships delete policy" on public.relationships
  for delete using (
    exists (
      select 1 from public.family_trees
      where id = relationships.tree_id and auth.uid() = owner_id
    )
  );
