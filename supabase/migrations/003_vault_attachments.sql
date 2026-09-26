-- ==============================================================================
-- PROJECT NATAL: AUDIO MEMORIES & DOCUMENT VAULT MIGRATION
-- Run this script in your Supabase SQL Editor:
-- Supabase Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ==============================================================================

-- 1. Add attachments JSONB column to public.people table
alter table public.people
  add column if not exists attachments jsonb default '[]'::jsonb not null;

-- 2. Create index on attachments for JSON querying
create index if not exists idx_people_attachments on public.people using gin (attachments);
