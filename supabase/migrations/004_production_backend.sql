-- ==============================================================================
-- PROJECT NATAL: PRODUCTION BACKEND MIGRATION (004)
-- Ticket Coverage: PRO-28 (Atomic GEDCOM RPC), PRO-29 (Storage Buckets),
--                  PRO-31 (Tier Capacity Trigger & DAG Graph Constraints)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SUPABASE STORAGE BUCKETS & POLICIES (PRO-29)
-- ------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'vault-audio',
    'vault-audio',
    true,
    26214400, -- 25 MB
    array['audio/webm', 'audio/webm;codecs=opus', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg']
  ),
  (
    'vault-docs',
    'vault-docs',
    true,
    26214400, -- 25 MB
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain']
  ),
  (
    'avatars',
    'avatars',
    true,
    5242880, -- 5 MB
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read access for vault and avatars" on storage.objects;
create policy "Public read access for vault and avatars"
  on storage.objects for select
  using (bucket_id in ('vault-audio', 'vault-docs', 'avatars'));

drop policy if exists "Authenticated upload for vault and avatars" on storage.objects;
create policy "Authenticated upload for vault and avatars"
  on storage.objects for insert
  with check (
    bucket_id in ('vault-audio', 'vault-docs', 'avatars')
    and auth.role() = 'authenticated'
  );

drop policy if exists "Authenticated update for vault and avatars" on storage.objects;
create policy "Authenticated update for vault and avatars"
  on storage.objects for update
  using (
    bucket_id in ('vault-audio', 'vault-docs', 'avatars')
    and auth.role() = 'authenticated'
  );

drop policy if exists "Authenticated delete for vault and avatars" on storage.objects;
create policy "Authenticated delete for vault and avatars"
  on storage.objects for delete
  using (
    bucket_id in ('vault-audio', 'vault-docs', 'avatars')
    and auth.role() = 'authenticated'
  );

-- ------------------------------------------------------------------------------
-- 2. GRAPH INTEGRITY CONSTRAINTS & DAG CYCLE TRIGGER (PRO-31)
-- ------------------------------------------------------------------------------
-- Self-parent / self-relationship CHECK constraint
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'chk_no_self_relationship'
  ) then
    alter table public.relationships
      add constraint chk_no_self_relationship check (person_a_id <> person_b_id);
  end if;
end $$;

-- Unique index to prevent duplicate symmetric links within a tree
create unique index if not exists idx_relationships_unique_pair
  on public.relationships (
    tree_id,
    least(person_a_id, person_b_id),
    greatest(person_a_id, person_b_id),
    type
  );

-- Directed Acyclic Graph (DAG) cycle prevention trigger for parent_child edges
create or replace function public.prevent_relationship_cycle()
returns trigger
language plpgsql
as $$
declare
  v_has_cycle boolean := false;
begin
  if new.person_a_id = new.person_b_id then
    raise exception 'CYCLE_DETECTED: Person cannot be an ancestor or relative of themselves';
  end if;

  if new.type = 'parent_child' then
    -- Check if new.person_a_id (parent) is already a descendant of new.person_b_id (child)
    with recursive descendants as (
      select r.person_b_id as descendant_id
      from public.relationships r
      where r.tree_id = new.tree_id
        and r.type = 'parent_child'
        and r.person_a_id = new.person_b_id
        and r.id <> coalesce(new.id, '')
      union
      select r.person_b_id
      from public.relationships r
      inner join descendants d on r.person_a_id = d.descendant_id
      where r.tree_id = new.tree_id
        and r.type = 'parent_child'
        and r.id <> coalesce(new.id, '')
    )
    select exists (
      select 1 from descendants where descendant_id = new.person_a_id
    ) into v_has_cycle;

    if v_has_cycle then
      raise exception 'CYCLE_DETECTED: Person cannot be an ancestor of themselves';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_relationship_cycle on public.relationships;
create trigger trg_prevent_relationship_cycle
  before insert or update on public.relationships
  for each row execute function public.prevent_relationship_cycle();

-- ------------------------------------------------------------------------------
-- 3. TIER CAPACITY BEFORE INSERT TRIGGER ON PEOPLE (PRO-31)
-- ------------------------------------------------------------------------------
create or replace function public.enforce_tree_member_limit()
returns trigger
language plpgsql
security definer
as $$
declare
  v_owner_tier text;
  v_current_count integer;
  v_max_people integer;
begin
  -- Allow upserts updating an existing person row with the same ID
  if exists (select 1 from public.people where id = new.id) then
    return new;
  end if;

  select coalesce(p.tier, 'free')
    into v_owner_tier
  from public.family_trees ft
  left join public.profiles p on p.id = ft.owner_id
  where ft.id = new.tree_id;

  if v_owner_tier = 'pro' then
    return new;
  elsif v_owner_tier = 'onetime' then
    v_max_people := 100;
  else
    v_max_people := 25;
  end if;

  select count(*)
    into v_current_count
  from public.people
  where tree_id = new.tree_id;

  if v_current_count >= v_max_people then
    raise exception 'TIER_LIMIT_EXCEEDED: Tree has reached maximum member capacity (%) for the % tier',
      v_max_people, v_owner_tier;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_tree_member_limit on public.people;
create trigger trg_enforce_tree_member_limit
  before insert on public.people
  for each row execute function public.enforce_tree_member_limit();

-- ------------------------------------------------------------------------------
-- 4. ATOMIC GEDCOM IMPORT RPC (PRO-28)
-- ------------------------------------------------------------------------------
create or replace function public.import_gedcom_tree(
  p_tree jsonb,
  p_people jsonb,
  p_relationships jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_tree_id text := p_tree->>'id';
  v_owner_id uuid := coalesce((p_tree->>'owner_id')::uuid, auth.uid());
  v_now timestamptz := timezone('utc'::text, now());
  v_person jsonb;
  v_rel jsonb;
  v_has_permission boolean := false;
begin
  if v_tree_id is null or length(trim(v_tree_id)) = 0 then
    raise exception 'INVALID_TREE_ID: Tree ID is required for GEDCOM import';
  end if;

  -- Check permission if tree already exists
  if exists (select 1 from public.family_trees where id = v_tree_id) then
    select exists (
      select 1 from public.family_trees ft
      where ft.id = v_tree_id
        and (
          ft.owner_id = auth.uid()
          or exists (
            select 1 from public.tree_collaborators tc
            where tc.tree_id = ft.id
              and tc.user_id = auth.uid()
              and tc.role in ('editor', 'admin')
              and tc.status = 'accepted'
          )
        )
    ) into v_has_permission;

    if not v_has_permission and auth.uid() is not null then
      raise exception 'FORBIDDEN: Insufficient permissions to import GEDCOM into this tree';
    end if;
  end if;

  -- 1. Upsert family_trees row
  insert into public.family_trees (
    id,
    owner_id,
    name,
    slug,
    description,
    settings,
    created_at,
    updated_at
  )
  values (
    v_tree_id,
    v_owner_id,
    coalesce(p_tree->>'name', 'Imported Family Tree'),
    coalesce(p_tree->>'slug', v_tree_id),
    p_tree->>'description',
    coalesce(p_tree->'settings', '{"isPublic": true, "allowClaiming": false, "theme": "light"}'::jsonb),
    v_now,
    v_now
  )
  on conflict (id) do update set
    name = excluded.name,
    slug = excluded.slug,
    description = excluded.description,
    settings = excluded.settings,
    updated_at = v_now;

  -- 2. Atomically clear existing relationships and people for this tree
  delete from public.relationships where tree_id = v_tree_id;
  delete from public.people where tree_id = v_tree_id;

  -- 3. Insert all imported people
  for v_person in select * from jsonb_array_elements(coalesce(p_people, '[]'::jsonb))
  loop
    insert into public.people (
      id,
      tree_id,
      first_name,
      last_name,
      maiden_name,
      nickname,
      gender,
      birth_date,
      death_date,
      birth_place,
      photo_url,
      bio,
      custom_fields,
      milestones,
      attachments,
      position_x,
      position_y,
      created_at,
      updated_at
    )
    values (
      v_person->>'id',
      v_tree_id,
      coalesce(v_person->>'first_name', v_person->>'firstName', 'Unknown'),
      coalesce(v_person->>'last_name', v_person->>'lastName', ''),
      coalesce(v_person->>'maiden_name', v_person->>'maidenName'),
      v_person->>'nickname',
      v_person->>'gender',
      coalesce(v_person->>'birth_date', v_person->>'birthDate'),
      coalesce(v_person->>'death_date', v_person->>'deathDate'),
      coalesce(v_person->>'birth_place', v_person->>'birthPlace'),
      coalesce(v_person->>'photo_url', v_person->>'photoUrl'),
      v_person->>'bio',
      coalesce(v_person->'custom_fields', v_person->'customFields', '{}'::jsonb),
      coalesce(v_person->'milestones', '[]'::jsonb),
      coalesce(v_person->'attachments', '[]'::jsonb),
      coalesce((v_person->>'position_x')::double precision, (v_person->>'positionX')::double precision, 0),
      coalesce((v_person->>'position_y')::double precision, (v_person->>'positionY')::double precision, 0),
      v_now,
      v_now
    );
  end loop;

  -- 4. Insert all imported relationships
  for v_rel in select * from jsonb_array_elements(coalesce(p_relationships, '[]'::jsonb))
  loop
    insert into public.relationships (
      id,
      tree_id,
      person_a_id,
      person_b_id,
      type,
      subtype,
      start_date,
      end_date,
      created_at
    )
    values (
      v_rel->>'id',
      v_tree_id,
      coalesce(v_rel->>'person_a_id', v_rel->>'personAId'),
      coalesce(v_rel->>'person_b_id', v_rel->>'personBId'),
      v_rel->>'type',
      coalesce(v_rel->>'subtype', 'biological'),
      coalesce(v_rel->>'start_date', v_rel->>'startDate'),
      coalesce(v_rel->>'end_date', v_rel->>'endDate'),
      v_now
    );
  end loop;

  return jsonb_build_object(
    'treeId', v_tree_id,
    'peopleCount', jsonb_array_length(coalesce(p_people, '[]'::jsonb)),
    'relationshipsCount', jsonb_array_length(coalesce(p_relationships, '[]'::jsonb)),
    'importedAt', v_now
  );
end;
$$;

