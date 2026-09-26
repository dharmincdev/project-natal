-- ==============================================================================
-- PROJECT NATAL: COLLABORATIVE TREES MIGRATION
-- Run this script in your Supabase SQL Editor:
-- Supabase Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ==============================================================================

-- 1. Create Tree Collaborators Table
create table if not exists public.tree_collaborators (
  id uuid primary key default gen_random_uuid(),
  tree_id text references public.family_trees(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  email text not null,
  role text check (role in ('viewer', 'editor', 'admin')) not null default 'editor',
  status text check (status in ('pending', 'accepted', 'declined')) not null default 'pending',
  invited_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (tree_id, email)
);

-- Performance Indexes
create index if not exists idx_collaborators_tree on public.tree_collaborators(tree_id);
create index if not exists idx_collaborators_user on public.tree_collaborators(user_id);
create index if not exists idx_collaborators_email on public.tree_collaborators(email);

-- Enable RLS
alter table public.tree_collaborators enable row level security;

-- 2. Drop existing policies if re-running
drop policy if exists "Collaborators select policy" on public.tree_collaborators;
drop policy if exists "Collaborators insert policy" on public.tree_collaborators;
drop policy if exists "Collaborators update policy" on public.tree_collaborators;
drop policy if exists "Collaborators delete policy" on public.tree_collaborators;

-- 3. Row-Level Security Policies for Tree Collaborators

-- View collaborators: tree owner, the collaborator themselves, or any other collaborator on that tree
create policy "Collaborators select policy" on public.tree_collaborators
  for select using (
    exists (
      select 1 from public.family_trees
      where id = tree_collaborators.tree_id and owner_id = auth.uid()
    )
    or user_id = auth.uid()
    or email = (select email from public.profiles where id = auth.uid())
    or exists (
      select 1 from public.tree_collaborators tc
      where tc.tree_id = tree_collaborators.tree_id
        and (tc.user_id = auth.uid() or tc.email = (select email from public.profiles where id = auth.uid()))
        and tc.status = 'accepted'
    )
  );

-- Insert collaborators: Tree owner OR an accepted Admin collaborator on that tree
create policy "Collaborators insert policy" on public.tree_collaborators
  for insert with check (
    exists (
      select 1 from public.family_trees
      where id = tree_collaborators.tree_id and owner_id = auth.uid()
    )
    or exists (
      select 1 from public.tree_collaborators tc
      where tc.tree_id = tree_collaborators.tree_id
        and (tc.user_id = auth.uid() or tc.email = (select email from public.profiles where id = auth.uid()))
        and tc.role = 'admin'
        and tc.status = 'accepted'
    )
  );

-- Update collaborators:
-- - Tree owner or Admin can change roles/status
-- - The collaborator themselves can update their status (accept/decline) or link their user_id
create policy "Collaborators update policy" on public.tree_collaborators
  for update using (
    exists (
      select 1 from public.family_trees
      where id = tree_collaborators.tree_id and owner_id = auth.uid()
    )
    or exists (
      select 1 from public.tree_collaborators tc
      where tc.tree_id = tree_collaborators.tree_id
        and (tc.user_id = auth.uid() or tc.email = (select email from public.profiles where id = auth.uid()))
        and tc.role = 'admin'
        and tc.status = 'accepted'
    )
    or user_id = auth.uid()
    or email = (select email from public.profiles where id = auth.uid())
  );

-- Delete collaborators: Tree owner, Admin collaborator, or the collaborator leaving the tree
create policy "Collaborators delete policy" on public.tree_collaborators
  for delete using (
    exists (
      select 1 from public.family_trees
      where id = tree_collaborators.tree_id and owner_id = auth.uid()
    )
    or exists (
      select 1 from public.tree_collaborators tc
      where tc.tree_id = tree_collaborators.tree_id
        and (tc.user_id = auth.uid() or tc.email = (select email from public.profiles where id = auth.uid()))
        and tc.role = 'admin'
        and tc.status = 'accepted'
    )
    or user_id = auth.uid()
    or email = (select email from public.profiles where id = auth.uid())
  );

-- 4. Update Family Trees, People, and Relationships Policies to honor collaborator permissions

-- Family Trees: Collaborators can view private trees they are part of
drop policy if exists "Trees select policy" on public.family_trees;
create policy "Trees select policy" on public.family_trees
  for select using (
    auth.uid() = owner_id 
    or (settings->>'isPublic')::boolean = true
    or exists (
      select 1 from public.tree_collaborators tc
      where tc.tree_id = family_trees.id
        and (tc.user_id = auth.uid() or tc.email = (select email from public.profiles where id = auth.uid()))
    )
  );

-- People: Collaborators can view people in trees they belong to
drop policy if exists "People select policy" on public.people;
create policy "People select policy" on public.people
  for select using (
    exists (
      select 1 from public.family_trees ft
      where ft.id = people.tree_id 
        and (
          ft.owner_id = auth.uid() 
          or (ft.settings->>'isPublic')::boolean = true
          or exists (
            select 1 from public.tree_collaborators tc
            where tc.tree_id = ft.id
              and (tc.user_id = auth.uid() or tc.email = (select email from public.profiles where id = auth.uid()))
          )
        )
    )
  );

-- People: Editors and Admins can insert/update/delete people
drop policy if exists "People insert policy" on public.people;
create policy "People insert policy" on public.people
  for insert with check (
    exists (
      select 1 from public.family_trees ft
      where ft.id = people.tree_id and (
        ft.owner_id = auth.uid()
        or exists (
          select 1 from public.tree_collaborators tc
          where tc.tree_id = ft.id
            and (tc.user_id = auth.uid() or tc.email = (select email from public.profiles where id = auth.uid()))
            and tc.role in ('editor', 'admin')
            and tc.status = 'accepted'
        )
      )
    )
  );

drop policy if exists "People update policy" on public.people;
create policy "People update policy" on public.people
  for update using (
    exists (
      select 1 from public.family_trees ft
      where ft.id = people.tree_id and (
        ft.owner_id = auth.uid()
        or exists (
          select 1 from public.tree_collaborators tc
          where tc.tree_id = ft.id
            and (tc.user_id = auth.uid() or tc.email = (select email from public.profiles where id = auth.uid()))
            and tc.role in ('editor', 'admin')
            and tc.status = 'accepted'
        )
      )
    )
  );

drop policy if exists "People delete policy" on public.people;
create policy "People delete policy" on public.people
  for delete using (
    exists (
      select 1 from public.family_trees ft
      where ft.id = people.tree_id and (
        ft.owner_id = auth.uid()
        or exists (
          select 1 from public.tree_collaborators tc
          where tc.tree_id = ft.id
            and (tc.user_id = auth.uid() or tc.email = (select email from public.profiles where id = auth.uid()))
            and tc.role in ('editor', 'admin')
            and tc.status = 'accepted'
        )
      )
    )
  );

-- Relationships: Editors and Admins can insert/update/delete relationships
drop policy if exists "Relationships select policy" on public.relationships;
create policy "Relationships select policy" on public.relationships
  for select using (
    exists (
      select 1 from public.family_trees ft
      where ft.id = relationships.tree_id 
        and (
          ft.owner_id = auth.uid() 
          or (ft.settings->>'isPublic')::boolean = true
          or exists (
            select 1 from public.tree_collaborators tc
            where tc.tree_id = ft.id
              and (tc.user_id = auth.uid() or tc.email = (select email from public.profiles where id = auth.uid()))
          )
        )
    )
  );

drop policy if exists "Relationships insert policy" on public.relationships;
create policy "Relationships insert policy" on public.relationships
  for insert with check (
    exists (
      select 1 from public.family_trees ft
      where ft.id = relationships.tree_id and (
        ft.owner_id = auth.uid()
        or exists (
          select 1 from public.tree_collaborators tc
          where tc.tree_id = ft.id
            and (tc.user_id = auth.uid() or tc.email = (select email from public.profiles where id = auth.uid()))
            and tc.role in ('editor', 'admin')
            and tc.status = 'accepted'
        )
      )
    )
  );

drop policy if exists "Relationships update policy" on public.relationships;
create policy "Relationships update policy" on public.relationships
  for update using (
    exists (
      select 1 from public.family_trees ft
      where ft.id = relationships.tree_id and (
        ft.owner_id = auth.uid()
        or exists (
          select 1 from public.tree_collaborators tc
          where tc.tree_id = ft.id
            and (tc.user_id = auth.uid() or tc.email = (select email from public.profiles where id = auth.uid()))
            and tc.role in ('editor', 'admin')
            and tc.status = 'accepted'
        )
      )
    )
  );

drop policy if exists "Relationships delete policy" on public.relationships;
create policy "Relationships delete policy" on public.relationships
  for delete using (
    exists (
      select 1 from public.family_trees ft
      where ft.id = relationships.tree_id and (
        ft.owner_id = auth.uid()
        or exists (
          select 1 from public.tree_collaborators tc
          where tc.tree_id = ft.id
            and (tc.user_id = auth.uid() or tc.email = (select email from public.profiles where id = auth.uid()))
            and tc.role in ('editor', 'admin')
            and tc.status = 'accepted'
        )
      )
    )
  );
