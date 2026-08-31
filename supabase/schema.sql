-- Shared Family Grocery List
-- Run in the Supabase SQL editor. The browser app uses only the publishable key.
create extension if not exists pgcrypto;

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Family Grocery List',
  created_by uuid not null references auth.users(id) on delete cascade,
  invite_code text not null unique default upper(encode(gen_random_bytes(8), 'hex')),
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table if not exists public.grocery_lists (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  week_start date not null,
  active boolean not null default true,
  seeded boolean not null default false,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.grocery_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.grocery_lists(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 160),
  category text not null default 'Other',
  quantity text not null default '',
  checked boolean not null default false,
  sort_order integer not null default 0,
  source text not null default 'manual',
  seed_key text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.grocery_items add column if not exists seed_key text;

create index if not exists household_members_user_idx on public.household_members(user_id);
create index if not exists grocery_lists_household_idx on public.grocery_lists(household_id);
create index if not exists grocery_items_list_idx on public.grocery_items(list_id, category, sort_order);
create unique index if not exists grocery_items_seed_idx on public.grocery_items(list_id, seed_key);

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.grocery_lists enable row level security;
alter table public.grocery_items enable row level security;
alter table public.grocery_items replica identity full;

create or replace function public.is_household_member(target_household uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.household_members
    where household_id = target_household and user_id = auth.uid()
  );
$$;

create or replace function public.is_list_member(target_list uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.grocery_lists gl
    join public.household_members hm on hm.household_id = gl.household_id
    where gl.id = target_list and hm.user_id = auth.uid()
  );
$$;

drop policy if exists "members can view households" on public.households;
create policy "members can view households" on public.households
for select to authenticated using (public.is_household_member(id));

drop policy if exists "owners can update households" on public.households;
create policy "owners can update households" on public.households
for update to authenticated
using (created_by = auth.uid()) with check (created_by = auth.uid());

drop policy if exists "members can view membership" on public.household_members;
create policy "members can view membership" on public.household_members
for select to authenticated using (public.is_household_member(household_id));

drop policy if exists "members can view lists" on public.grocery_lists;
create policy "members can view lists" on public.grocery_lists
for select to authenticated using (public.is_household_member(household_id));

drop policy if exists "members can create lists" on public.grocery_lists;
create policy "members can create lists" on public.grocery_lists
for insert to authenticated
with check (public.is_household_member(household_id) and created_by = auth.uid());

drop policy if exists "members can update lists" on public.grocery_lists;
create policy "members can update lists" on public.grocery_lists
for update to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

drop policy if exists "members can delete lists" on public.grocery_lists;
create policy "members can delete lists" on public.grocery_lists
for delete to authenticated using (public.is_household_member(household_id));

drop policy if exists "members can view items" on public.grocery_items;
create policy "members can view items" on public.grocery_items
for select to authenticated using (public.is_list_member(list_id));

drop policy if exists "members can add items" on public.grocery_items;
create policy "members can add items" on public.grocery_items
for insert to authenticated
with check (public.is_list_member(list_id) and created_by = auth.uid());

drop policy if exists "members can update items" on public.grocery_items;
create policy "members can update items" on public.grocery_items
for update to authenticated
using (public.is_list_member(list_id))
with check (public.is_list_member(list_id));

drop policy if exists "members can delete items" on public.grocery_items;
create policy "members can delete items" on public.grocery_items
for delete to authenticated using (public.is_list_member(list_id));

create or replace function public.create_household(household_name text default 'Family Grocery List')
returns table (household_id uuid, invite_code text, list_id uuid)
language plpgsql security definer set search_path = public
as $$
declare
  new_household public.households;
  new_list public.grocery_lists;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if exists (select 1 from public.household_members where user_id = auth.uid()) then
    raise exception 'You already belong to a household';
  end if;

  insert into public.households(name, created_by)
  values (coalesce(nullif(trim(household_name), ''), 'Family Grocery List'), auth.uid())
  returning * into new_household;

  insert into public.household_members(household_id, user_id, role)
  values (new_household.id, auth.uid(), 'owner');

  insert into public.grocery_lists(household_id, title, week_start, created_by)
  values (
    new_household.id,
    'Wegmans Grocery List — August 31–September 5, 2026',
    date '2026-08-31',
    auth.uid()
  )
  returning * into new_list;

  return query select new_household.id, new_household.invite_code, new_list.id;
end;
$$;

create or replace function public.join_household(join_code text)
returns uuid language plpgsql security definer set search_path = public
as $$
declare target_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if exists (select 1 from public.household_members where user_id = auth.uid()) then
    raise exception 'You already belong to a household';
  end if;

  select id into target_id from public.households
  where invite_code = upper(trim(join_code));

  if target_id is null then raise exception 'Invite code not found'; end if;

  insert into public.household_members(household_id, user_id, role)
  values (target_id, auth.uid(), 'member')
  on conflict do nothing;

  return target_id;
end;
$$;

create or replace function public.rotate_household_invite(target_household uuid)
returns text language plpgsql security definer set search_path = public
as $$
declare new_code text;
begin
  update public.households
  set invite_code = upper(encode(gen_random_bytes(8), 'hex'))
  where id = target_household and created_by = auth.uid()
  returning invite_code into new_code;

  if new_code is null then raise exception 'Owner access required'; end if;
  return new_code;
end;
$$;

create or replace function public.touch_grocery_item()
returns trigger language plpgsql set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists grocery_items_touch on public.grocery_items;
create trigger grocery_items_touch
before update on public.grocery_items
for each row execute function public.touch_grocery_item();

revoke all on public.households, public.household_members, public.grocery_lists, public.grocery_items from anon;
grant select, update on public.households to authenticated;
grant select on public.household_members to authenticated;
grant select, insert, update, delete on public.grocery_lists to authenticated;
grant select, insert, update, delete on public.grocery_items to authenticated;
grant execute on function public.create_household(text) to authenticated;
grant execute on function public.join_household(text) to authenticated;
grant execute on function public.rotate_household_invite(uuid) to authenticated;
grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.is_list_member(uuid) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'grocery_items'
  ) then
    alter publication supabase_realtime add table public.grocery_items;
  end if;
end
$$;
