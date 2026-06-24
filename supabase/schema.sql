-- Learner platform — database schema
-- Run this once in your Supabase project: Dashboard → SQL Editor → paste → Run.
-- Safe to re-run (idempotent).

-- 1. NOTES — Learn-tab notes (per-section "module-K" notes + the "general" box)
create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  uid         uuid not null references auth.users (id) on delete cascade,
  module_id   text not null,          -- e.g. "mern-architect-2"
  topic_id    text not null,          -- e.g. "module-5" (or "general")
  content     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (uid, module_id, topic_id)
);
alter table public.notes enable row level security;
drop policy if exists "own notes" on public.notes;
create policy "own notes" on public.notes
  for all using (auth.uid() = uid) with check (auth.uid() = uid);

-- 2. PROGRESS — module completion ("Mark Complete" toggle)
create table if not exists public.progress (
  id          uuid primary key default gen_random_uuid(),
  uid         uuid not null references auth.users (id) on delete cascade,
  module_id   text not null,
  status      text not null default 'unstarted',   -- unstarted | in_progress | done
  updated_at  timestamptz not null default now(),
  unique (uid, module_id)
);
alter table public.progress enable row level security;
drop policy if exists "own progress" on public.progress;
create policy "own progress" on public.progress
  for all using (auth.uid() = uid) with check (auth.uid() = uid);

-- 3. SAVED_CODE — Practice-tab editor
create table if not exists public.saved_code (
  id          uuid primary key default gen_random_uuid(),
  uid         uuid not null references auth.users (id) on delete cascade,
  module_id   text not null,
  problem_id  text not null default 'default',
  code        text,
  language    text,
  solved      boolean not null default false,   -- Interview-tab problems
  updated_at  timestamptz not null default now(),
  unique (uid, module_id, problem_id)
);
-- If the table already existed without it, add the column:
alter table public.saved_code add column if not exists solved boolean not null default false;
alter table public.saved_code enable row level security;
drop policy if exists "own saved_code" on public.saved_code;
create policy "own saved_code" on public.saved_code
  for all using (auth.uid() = uid) with check (auth.uid() = uid);

-- 4. REVISION COUNTER — per-SECTION "how many times I revised this" (Learn tab).
-- Same grain as notes: one row per (uid, module_id, topic_id) where topic_id is
-- a section anchor like "module-3".
create table if not exists public.revisions (
  id                   uuid primary key default gen_random_uuid(),
  uid                  uuid not null references auth.users (id) on delete cascade,
  module_id            text not null,          -- e.g. "mern-architect-9"
  topic_id             text not null,          -- e.g. "module-3"
  count                int  not null default 0,
  last_changed_at      timestamptz,
  last_incremented_at  timestamptz,            -- drives the 4-hour once-per-window rule
  unique (uid, module_id, topic_id)
);
-- If the table already existed without it:
alter table public.revisions add column if not exists last_incremented_at timestamptz;
alter table public.revisions enable row level security;
drop policy if exists "own revisions" on public.revisions;
create policy "own revisions" on public.revisions
  for all using (auth.uid() = uid) with check (auth.uid() = uid);

-- Clean up the earlier per-module overload if it was ever applied.
drop function if exists public.bump_revision(text, int);

-- Atomic bump with a 4-HOUR WINDOW RULE (enforced here so it can't be bypassed):
--   * increment (+1): allowed at most ONCE per 4h per section.
--   * decrement (-1): only undoes an increment made within the current 4h window.
-- Returns the new state plus a `blocked` flag (+ reason) when a rule blocks it.
create or replace function public.bump_revision(p_module_id text, p_topic_id text, p_delta int)
returns json
language plpgsql
security invoker
as $$
declare
  v_uid uuid := auth.uid();
  v_window constant interval := interval '4 hours';
  v_count int;
  v_changed timestamptz;
  v_inc timestamptz;
  v_blocked boolean := false;
  v_reason text;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  -- Lock the row (if any) so two tabs can't both pass the window check.
  select count, last_changed_at, last_incremented_at
    into v_count, v_changed, v_inc
  from public.revisions
  where uid = v_uid and module_id = p_module_id and topic_id = p_topic_id
  for update;

  if p_delta > 0 then
    if v_inc is not null and now() - v_inc < v_window then
      v_blocked := true; v_reason := 'cooldown';
    else
      v_count := coalesce(v_count, 0) + 1;
      v_inc := now();
      v_changed := now();
    end if;
  elsif p_delta < 0 then
    if v_inc is null or now() - v_inc >= v_window then
      v_blocked := true; v_reason := 'nothing_to_undo';
    else
      v_count := greatest(0, coalesce(v_count, 0) - 1);
      v_inc := null;            -- the in-window increment has been undone
      v_changed := now();
    end if;
  end if;

  if not v_blocked then
    insert into public.revisions (uid, module_id, topic_id, count, last_changed_at, last_incremented_at)
    values (v_uid, p_module_id, p_topic_id, v_count, v_changed, v_inc)
    on conflict (uid, module_id, topic_id) do update
      set count = excluded.count,
          last_changed_at = excluded.last_changed_at,
          last_incremented_at = excluded.last_incremented_at;
  end if;

  return json_build_object(
    'count', coalesce(v_count, 0),
    'last_changed_at', v_changed,
    'last_incremented_at', v_inc,
    'blocked', v_blocked,
    'reason', v_reason
  );
end;
$$;

grant execute on function public.bump_revision(text, text, int) to authenticated;
